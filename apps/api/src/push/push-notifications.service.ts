import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  PUSH_NOTIFICATION_TITLE,
  type PushEventKeyValue,
} from './push-event-keys.js';
import { PushDispatcherService } from './push-dispatcher.service.js';

export type EnqueuePushInput = {
  idempotencyKey: string;
  eventKey: PushEventKeyValue;
  actorUserId: string;
  body: string;
  title?: string;
  /** Safe metadata only — never notes, secrets, or private partner details. */
  payload?: Record<string, string | number | boolean | null>;
};

/**
 * Transactional outbox writer + post-commit dispatch scheduler.
 * Business operations must call enqueue inside the same Prisma transaction
 * that commits the business fact, then scheduleDispatch after commit.
 */
@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatcher: PushDispatcherService,
  ) {}

  /**
   * Atomically records one notification event and pending delivery rows for
   * every active subscription belonging to other active users.
   * Returns the event id, or null when the idempotency key already exists.
   */
  async enqueueInTransaction(
    tx: Prisma.TransactionClient,
    input: EnqueuePushInput,
  ): Promise<string | null> {
    const title = input.title?.trim() || PUSH_NOTIFICATION_TITLE;
    const body = input.body.trim();
    if (!body) {
      this.logger.warn(
        `Skipping empty push body for eventKey=${input.eventKey}`,
      );
      return null;
    }

    let event: { id: string };
    try {
      event = await tx.pushNotificationEvent.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          eventKey: input.eventKey,
          actorUserId: input.actorUserId,
          title,
          body,
          payloadJson: input.payload
            ? (input.payload as Prisma.InputJsonValue)
            : undefined,
        },
        select: { id: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.log(
          `Duplicate push event ignored key=${input.idempotencyKey}`,
        );
        return null;
      }
      throw error;
    }

    const subscriptions = await tx.pushSubscription.findMany({
      where: {
        isActive: true,
        userId: { not: input.actorUserId },
        user: { isActive: true },
      },
      select: { id: true },
    });

    const uniqueIds = [...new Set(subscriptions.map((s) => s.id))];

    if (uniqueIds.length > 0) {
      await tx.pushDelivery.createMany({
        data: uniqueIds.map((subscriptionId) => ({
          eventId: event.id,
          subscriptionId,
          status: 'PENDING',
          nextAttemptAt: new Date(),
        })),
        skipDuplicates: true,
      });
    }

    this.logger.log(
      JSON.stringify({
        msg: 'push_event_created',
        eventKey: input.eventKey,
        eventId: event.id,
        recipientSubscriptionCount: uniqueIds.length,
      }),
    );

    return event.id;
  }

  /** Fire-and-forget immediate dispatch after a successful business commit. */
  scheduleDispatch(eventId: string | null | undefined): void {
    if (!eventId) return;
    void this.dispatcher.dispatchEvent(eventId).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'unknown';
      this.logger.error(
        `Immediate push dispatch failed eventId=${eventId}: ${message}`,
      );
    });
  }

  /**
   * Resolve actor display name inside a transaction (fullName, else username).
   */
  async resolveActorName(
    tx: Prisma.TransactionClient,
    actorUserId: string,
  ): Promise<string> {
    const user = await tx.user.findUnique({
      where: { id: actorUserId },
      select: { fullName: true, username: true },
    });
    const full = user?.fullName?.trim();
    if (full) return full;
    const username = user?.username?.trim();
    if (username) return username;
    return 'İstifadəçi';
  }
}
