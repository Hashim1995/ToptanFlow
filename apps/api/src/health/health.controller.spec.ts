import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns basic application health information only', () => {
    const result = controller.check();

    expect(result.status).toBe('ok');
    expect(typeof result.uptimeSeconds).toBe('number');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');

    // No infrastructure or secret detail must ever be present.
    const keys = Object.keys(result);
    expect(keys).toEqual(['status', 'uptimeSeconds', 'timestamp']);
  });
});
