import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PushSubscriptionsService } from './push-subscriptions.service';

describe('PushSubscriptionsService', () => {
  const prisma = {
    pushSubscription: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const service = new PushSubscriptionsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upserts subscription for the current user', async () => {
    prisma.pushSubscription.upsert.mockResolvedValue({
      id: 'sub-1',
      endpoint: 'https://push.example/endpoint-a',
      isActive: true,
      deviceLabel: null,
      createdAt: new Date('2026-08-04T00:00:00.000Z'),
      updatedAt: new Date('2026-08-04T00:00:00.000Z'),
      lastUsedAt: new Date('2026-08-04T00:00:00.000Z'),
    });

    const result = await service.upsert('user-a', {
      endpoint: 'https://push.example/endpoint-a',
      keys: { p256dh: 'p256', auth: 'auth' },
    });

    expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { endpoint: 'https://push.example/endpoint-a' },
        create: expect.objectContaining({ userId: 'user-a', isActive: true }),
        update: expect.objectContaining({ userId: 'user-a', isActive: true }),
      }),
    );
    expect(result.id).toBe('sub-1');
  });

  it('rejects non-https endpoints', async () => {
    await expect(
      service.upsert('user-a', {
        endpoint: 'http://insecure.example/push',
        keys: { p256dh: 'p256', auth: 'auth' },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('unsubscribes only own subscription', async () => {
    prisma.pushSubscription.findUnique.mockResolvedValue({
      id: 'sub-1',
      userId: 'user-a',
    });
    prisma.pushSubscription.update.mockResolvedValue({});

    await expect(
      service.unsubscribe('user-a', {
        endpoint: 'https://push.example/endpoint-a',
      }),
    ).resolves.toEqual({ ok: true });

    prisma.pushSubscription.findUnique.mockResolvedValue({
      id: 'sub-2',
      userId: 'user-b',
    });
    await expect(
      service.unsubscribe('user-a', {
        endpoint: 'https://push.example/endpoint-b',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
