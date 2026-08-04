import { UnauthorizedException } from '@nestjs/common';
import { PushDispatchController } from './push.controller';

describe('PushDispatchController', () => {
  const pushConfig = {
    getDispatchSecret: jest.fn(),
  };
  const dispatcher = {
    dispatchPending: jest.fn().mockResolvedValue({
      processed: 1,
      sent: 1,
      invalidRemoved: 0,
      transientFailures: 0,
      finalFailures: 0,
    }),
  };

  const controller = new PushDispatchController(
    pushConfig as never,
    dispatcher as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    pushConfig.getDispatchSecret.mockReturnValue('secret-value');
  });

  it('rejects missing or wrong secret', async () => {
    await expect(
      controller.dispatch(undefined, undefined),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      controller.dispatch('wrong', undefined),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts x-push-dispatch-secret header', async () => {
    await expect(
      controller.dispatch('secret-value', undefined),
    ).resolves.toEqual(expect.objectContaining({ sent: 1 }));
  });

  it('accepts Authorization Bearer secret', async () => {
    await expect(
      controller.dispatch(undefined, 'Bearer secret-value'),
    ).resolves.toEqual(expect.objectContaining({ sent: 1 }));
  });
});
