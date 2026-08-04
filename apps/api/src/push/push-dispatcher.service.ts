import { Injectable, Logger } from '@nestjs/common';
import webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service.js';
import { PushConfigService } from './push-config.service.js';
import type { PushDispatchResultDto } from './dto/push-subscription-response.dto.js';

const MAX_ATTEMPTS = 8;
const DEFAULT_BATCH_SIZE = 40;
/** Soft time budget for Vercel serverless (ms). */
const EXECUTION_BUDGET_MS = 20_000;

function backoffSeconds(attemptCount: number): number {
  // 30s, 60s, 120s, ... capped at 1 hour
  const seconds = Math.min(3600, 30 * 2 ** Math.max(0, attemptCount - 1));
  return seconds;
}

type WebPushErrorLike = {
  statusCode?: number;
  message?: string;
};

@Injectable()
export class PushDispatcherService {
  private readonly logger = new Logger(PushDispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushConfig: PushConfigService,
  ) {}

  async dispatchEvent(eventId: string): Promise<PushDispatchResultDto> {
    return this.dispatchPending({ eventId, batchSize: DEFAULT_BATCH_SIZE });
  }

  async dispatchPending(options?: {
    eventId?: string;
    batchSize?: number;
  }): Promise<PushDispatchResultDto> {
    const started = Date.now();
    const result: PushDispatchResultDto = {
      processed: 0,
      sent: 0,
      invalidRemoved: 0,
      transientFailures: 0,
      finalFailures: 0,
    };

    const vapid = this.pushConfig.getVapidConfig();
    if (!vapid) {
      this.pushConfig.logMissingConfigIfNeeded('dispatch');
      return result;
    }

    webpush.setVapidDetails(vapid.contact, vapid.publicKey, vapid.privateKey);

    const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
    const now = new Date();

    const deliveries = await this.prisma.pushDelivery.findMany({
      where: {
        ...(options?.eventId ? { eventId: options.eventId } : {}),
        status: { in: ['PENDING', 'FAILED_RETRYABLE'] },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        subscription: { isActive: true },
      },
      take: batchSize,
      orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        attemptCount: true,
        event: {
          select: {
            id: true,
            title: true,
            body: true,
            eventKey: true,
          },
        },
        subscription: {
          select: {
            id: true,
            endpoint: true,
            p256dh: true,
            auth: true,
            isActive: true,
          },
        },
      },
    });

    for (const delivery of deliveries) {
      if (Date.now() - started > EXECUTION_BUDGET_MS) {
        this.logger.warn('Push dispatch stopped: serverless time budget');
        break;
      }

      result.processed += 1;
      const attemptCount = delivery.attemptCount + 1;

      try {
        const payload = JSON.stringify({
          title: delivery.event.title,
          body: delivery.event.body,
          tag: delivery.event.eventKey,
        });

        await webpush.sendNotification(
          {
            endpoint: delivery.subscription.endpoint,
            keys: {
              p256dh: delivery.subscription.p256dh,
              auth: delivery.subscription.auth,
            },
          },
          payload,
          {
            TTL: 60 * 60 * 12,
            urgency: 'normal',
          },
        );

        await this.prisma.$transaction([
          this.prisma.pushDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'SENT',
              attemptCount,
              sentAt: new Date(),
              lastErrorCategory: null,
              nextAttemptAt: null,
            },
          }),
          this.prisma.pushSubscription.update({
            where: { id: delivery.subscription.id },
            data: {
              lastUsedAt: new Date(),
              failureCount: 0,
            },
          }),
        ]);
        result.sent += 1;
      } catch (error: unknown) {
        const statusCode = this.readStatusCode(error);
        if (statusCode === 404 || statusCode === 410) {
          await this.prisma.$transaction([
            this.prisma.pushDelivery.update({
              where: { id: delivery.id },
              data: {
                status: 'SKIPPED_INVALID_SUBSCRIPTION',
                attemptCount,
                lastErrorCategory: 'subscription_gone',
                nextAttemptAt: null,
              },
            }),
            this.prisma.pushSubscription.update({
              where: { id: delivery.subscription.id },
              data: {
                isActive: false,
                disabledAt: new Date(),
                failureCount: { increment: 1 },
              },
            }),
          ]);
          result.invalidRemoved += 1;
          continue;
        }

        if (statusCode === 401 || statusCode === 403) {
          this.logger.error(
            `Push auth/config failure status=${statusCode ?? 'n/a'} (secrets not logged)`,
          );
          await this.markRetryOrFinal(
            delivery.id,
            attemptCount,
            'auth_config',
            result,
          );
          continue;
        }

        await this.markRetryOrFinal(
          delivery.id,
          attemptCount,
          statusCode ? `http_${statusCode}` : 'transient',
          result,
        );
      }
    }

    this.logger.log(
      JSON.stringify({
        msg: 'push_dispatch_batch',
        ...result,
        eventId: options?.eventId ?? null,
      }),
    );

    return result;
  }

  private async markRetryOrFinal(
    deliveryId: string,
    attemptCount: number,
    errorCategory: string,
    result: PushDispatchResultDto,
  ): Promise<void> {
    if (attemptCount >= MAX_ATTEMPTS) {
      await this.prisma.pushDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'FAILED_FINAL',
          attemptCount,
          lastErrorCategory: errorCategory,
          nextAttemptAt: null,
        },
      });
      result.finalFailures += 1;
      return;
    }

    const nextAttemptAt = new Date(
      Date.now() + backoffSeconds(attemptCount) * 1000,
    );
    await this.prisma.pushDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'FAILED_RETRYABLE',
        attemptCount,
        lastErrorCategory: errorCategory,
        nextAttemptAt,
      },
    });
    result.transientFailures += 1;
  }

  private readStatusCode(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') return undefined;
    const maybe = error as WebPushErrorLike;
    return typeof maybe.statusCode === 'number' ? maybe.statusCode : undefined;
  }
}
