import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto.js';
import { DeletePushSubscriptionDto } from './dto/delete-push-subscription.dto.js';
import { PushStatusQueryDto } from './dto/push-status-query.dto.js';
import {
  PushStatusResponseDto,
  PushSubscriptionResponseDto,
} from './dto/push-subscription-response.dto.js';

const MAX_ENDPOINT_LENGTH = 2048;
const MAX_KEY_LENGTH = 512;
const MAX_UA_LENGTH = 512;
const MAX_DEVICE_LABEL_LENGTH = 120;

@Injectable()
export class PushSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    userId: string,
    dto: CreatePushSubscriptionDto,
  ): Promise<PushSubscriptionResponseDto> {
    const endpoint = dto.endpoint.trim();
    const p256dh = dto.keys.p256dh.trim();
    const auth = dto.keys.auth.trim();

    this.assertSubscriptionShape(endpoint, p256dh, auth);

    const userAgent = dto.userAgent?.trim().slice(0, MAX_UA_LENGTH) || null;
    const deviceLabel =
      dto.deviceLabel?.trim().slice(0, MAX_DEVICE_LABEL_LENGTH) || null;

    const row = await this.prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId,
        endpoint,
        p256dh,
        auth,
        userAgent,
        deviceLabel,
        isActive: true,
        failureCount: 0,
        disabledAt: null,
        lastUsedAt: new Date(),
      },
      update: {
        userId,
        p256dh,
        auth,
        userAgent,
        deviceLabel,
        isActive: true,
        failureCount: 0,
        disabledAt: null,
        lastUsedAt: new Date(),
      },
      select: {
        id: true,
        endpoint: true,
        isActive: true,
        deviceLabel: true,
        createdAt: true,
        updatedAt: true,
        lastUsedAt: true,
      },
    });

    return this.toResponse(row);
  }

  async unsubscribe(
    userId: string,
    dto: DeletePushSubscriptionDto,
  ): Promise<{ ok: true }> {
    const endpoint = dto.endpoint.trim();
    if (!endpoint) {
      throw new BadRequestException({
        message: 'Endpoint is required',
        code: 'PUSH_ENDPOINT_REQUIRED',
      });
    }

    const existing = await this.prisma.pushSubscription.findUnique({
      where: { endpoint },
      select: { id: true, userId: true },
    });

    if (!existing || existing.userId !== userId) {
      // Do not leak whether another user's endpoint exists.
      throw new NotFoundException({
        message: 'Push subscription not found',
        code: 'PUSH_SUBSCRIPTION_NOT_FOUND',
      });
    }

    await this.prisma.pushSubscription.update({
      where: { id: existing.id },
      data: {
        isActive: false,
        disabledAt: new Date(),
      },
    });

    return { ok: true };
  }

  async status(
    userId: string,
    query: PushStatusQueryDto,
  ): Promise<PushStatusResponseDto> {
    if (!query.endpoint?.trim()) {
      const activeCount = await this.prisma.pushSubscription.count({
        where: { userId, isActive: true },
      });
      return {
        configured: true,
        hasActiveSubscription: activeCount > 0,
        activeDeviceCount: activeCount,
        endpointActive: null,
      };
    }

    const endpoint = query.endpoint.trim();
    const row = await this.prisma.pushSubscription.findFirst({
      where: { userId, endpoint },
      select: { isActive: true },
    });

    const activeCount = await this.prisma.pushSubscription.count({
      where: { userId, isActive: true },
    });

    return {
      configured: true,
      hasActiveSubscription: activeCount > 0,
      activeDeviceCount: activeCount,
      endpointActive: row ? row.isActive : false,
    };
  }

  private assertSubscriptionShape(
    endpoint: string,
    p256dh: string,
    auth: string,
  ): void {
    if (!endpoint || endpoint.length > MAX_ENDPOINT_LENGTH) {
      throw new BadRequestException({
        message: 'Invalid push endpoint',
        code: 'PUSH_ENDPOINT_INVALID',
      });
    }
    if (!/^https:\/\//i.test(endpoint)) {
      throw new BadRequestException({
        message: 'Push endpoint must be HTTPS',
        code: 'PUSH_ENDPOINT_INVALID',
      });
    }
    if (!p256dh || p256dh.length > MAX_KEY_LENGTH) {
      throw new BadRequestException({
        message: 'Invalid p256dh key',
        code: 'PUSH_KEYS_INVALID',
      });
    }
    if (!auth || auth.length > MAX_KEY_LENGTH) {
      throw new BadRequestException({
        message: 'Invalid auth key',
        code: 'PUSH_KEYS_INVALID',
      });
    }
  }

  private toResponse(row: {
    id: string;
    endpoint: string;
    isActive: boolean;
    deviceLabel: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt: Date | null;
  }): PushSubscriptionResponseDto {
    return {
      id: row.id,
      endpoint: row.endpoint,
      isActive: row.isActive,
      deviceLabel: row.deviceLabel,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    };
  }
}
