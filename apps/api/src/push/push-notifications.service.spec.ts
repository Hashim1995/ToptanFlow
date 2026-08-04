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

    const eventId = await service.enqueueInTransaction(tx, {
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

    const eventId = await service.enqueueInTransaction(tx, {
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

  it('enqueueBestEffort catches $transaction errors and does not throw', async () => {
    const failingPrisma = {
      $transaction: jest
        .fn()
        .mockRejectedValue(new Error('push tables missing')),
    };
    const resilientService = new PushNotificationsService(
      failingPrisma as never,
      dispatcher as never,
    );

    await expect(
      resilientService.enqueueBestEffort({
        idempotencyKey: 'cash.in:txn-1',
        eventKey: 'cash.cash_in',
        actorUserId: 'actor-a',
        body: 'body',
      }),
    ).resolves.toBeUndefined();

    expect(failingPrisma.$transaction).toHaveBeenCalled();
    expect(dispatcher.dispatchEvent).not.toHaveBeenCalled();
  });

  it('resolveActorName uses actorUserId only', async () => {
    const prismaWithUser = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          fullName: 'Murad Əliyev',
          username: 'murad',
        }),
      },
    };
    const actorService = new PushNotificationsService(
      prismaWithUser as never,
      dispatcher as never,
    );

    await expect(actorService.resolveActorName('user-1')).resolves.toBe(
      'Murad Əliyev',
    );
    expect(prismaWithUser.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { fullName: true, username: true },
    });
  });

  it('notifyCashExpense does not throw when prisma fails', () => {
    const failingPrisma = {
      user: {
        findUnique: jest.fn().mockRejectedValue(new Error('db down')),
      },
      cashAccount: {
        findUnique: jest.fn().mockRejectedValue(new Error('db down')),
      },
      $transaction: jest.fn(),
    };
    const resilientService = new PushNotificationsService(
      failingPrisma as never,
      dispatcher as never,
    );

    expect(() =>
      resilientService.notifyCashExpense({
        actorUserId: 'actor-a',
        transactionId: 'txn-1',
        cashAccountId: 'ca-1',
        amount: '100.00',
      }),
    ).not.toThrow();
  });
});
