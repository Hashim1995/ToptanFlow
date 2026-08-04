import { PushDispatcherService } from './push-dispatcher.service';

jest.mock('web-push', () => ({
  __esModule: true,
  default: {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn(),
  },
}));

import webpush from 'web-push';

describe('PushDispatcherService', () => {
  const prisma = {
    pushDelivery: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    pushSubscription: {
      update: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown) =>
      Promise.all(ops as Promise<unknown>[]),
    ),
  };

  const pushConfig = {
    getVapidConfig: jest.fn().mockReturnValue({
      publicKey: 'pub',
      privateKey: 'priv',
      contact: 'mailto:admin@toptanflow.az',
    }),
    logMissingConfigIfNeeded: jest.fn(),
  };

  const service = new PushDispatcherService(
    prisma as never,
    pushConfig as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    pushConfig.getVapidConfig.mockReturnValue({
      publicKey: 'pub',
      privateKey: 'priv',
      contact: 'mailto:admin@toptanflow.az',
    });
    (webpush.sendNotification as jest.Mock).mockResolvedValue({});
    prisma.pushDelivery.update.mockResolvedValue({});
    prisma.pushSubscription.update.mockResolvedValue({});
  });

  it('marks invalid subscriptions on 410 and does not retry them', async () => {
    prisma.pushDelivery.findMany.mockResolvedValue([
      {
        id: 'del-1',
        attemptCount: 0,
        event: {
          id: 'evt-1',
          title: 'TOPTANFLOW',
          body: 'body',
          eventKey: 'cash.cash_in',
        },
        subscription: {
          id: 'sub-1',
          endpoint: 'https://push.example/gone',
          p256dh: 'x',
          auth: 'y',
          isActive: true,
        },
      },
    ]);
    (webpush.sendNotification as jest.Mock).mockRejectedValue({
      statusCode: 410,
    });

    const result = await service.dispatchPending();
    expect(result.invalidRemoved).toBe(1);
    expect(prisma.pushDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SKIPPED_INVALID_SUBSCRIPTION',
        }),
      }),
    );
    expect(prisma.pushSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      }),
    );
  });

  it('marks transient failures as retryable', async () => {
    prisma.pushDelivery.findMany.mockResolvedValue([
      {
        id: 'del-2',
        attemptCount: 1,
        event: {
          id: 'evt-2',
          title: 'TOPTANFLOW',
          body: 'body',
          eventKey: 'cash.cash_in',
        },
        subscription: {
          id: 'sub-2',
          endpoint: 'https://push.example/tmp',
          p256dh: 'x',
          auth: 'y',
          isActive: true,
        },
      },
    ]);
    (webpush.sendNotification as jest.Mock).mockRejectedValue({
      statusCode: 500,
    });

    const result = await service.dispatchPending();
    expect(result.transientFailures).toBe(1);
    expect(prisma.pushDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FAILED_RETRYABLE',
        }),
      }),
    );
  });
});
