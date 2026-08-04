import { Prisma } from '../../generated/prisma/client.js';
import { PushNotificationsService } from './push-notifications.service';

describe('PushNotificationsService', () => {
  const prisma = {};
  const dispatcher = { dispatchEvent: jest.fn().mockResolvedValue({}) };

  const service = new PushNotificationsService(
    prisma as never,
    dispatcher as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('excludes actor and inactive users when creating deliveries', async () => {
    const tx = {
      pushNotificationEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      },
      pushSubscription: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'sub-b1' },
            { id: 'sub-b2' },
            { id: 'sub-c1' },
          ]),
      },
      pushDelivery: {
        createMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
    };

    const eventId = await service.enqueueInTransaction(tx as never, {
      idempotencyKey: 'cash.in:txn-1',
      eventKey: 'cash.cash_in',
      actorUserId: 'actor-a',
      body: 'Murad — Kassa mədaxili: 250.00 AZN · Əsas kassa',
    });

    expect(eventId).toBe('evt-1');
    expect(tx.pushSubscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          userId: { not: 'actor-a' },
          user: { isActive: true },
        }),
      }),
    );
    expect(tx.pushDelivery.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skipDuplicates: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            eventId: 'evt-1',
            subscriptionId: 'sub-b1',
            status: 'PENDING',
          }),
        ]),
      }),
    );
  });

  it('returns null on duplicate idempotency key without creating deliveries', async () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unique', {
      code: 'P2002',
      clientVersion: 'test',
    });

    const tx = {
      pushNotificationEvent: {
        create: jest.fn().mockRejectedValue(err),
      },
      pushSubscription: { findMany: jest.fn() },
      pushDelivery: { createMany: jest.fn() },
    };

    const eventId = await service.enqueueInTransaction(tx as never, {
      idempotencyKey: 'cash.in:txn-1',
      eventKey: 'cash.cash_in',
      actorUserId: 'actor-a',
      body: 'body',
    });

    expect(eventId).toBeNull();
    expect(tx.pushSubscription.findMany).not.toHaveBeenCalled();
  });

  it('scheduleDispatch ignores null and does not throw on dispatch failure', () => {
    service.scheduleDispatch(null);
    expect(dispatcher.dispatchEvent).not.toHaveBeenCalled();

    dispatcher.dispatchEvent.mockRejectedValueOnce(new Error('network'));
    expect(() => service.scheduleDispatch('evt-1')).not.toThrow();
  });
});
