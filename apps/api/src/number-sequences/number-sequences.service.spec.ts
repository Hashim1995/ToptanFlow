import { InternalServerErrorException } from '@nestjs/common';
import { BusinessCodeSequenceKey } from './business-code-sequence-key';
import type { BusinessCodeSequenceKey as SequenceKey } from './business-code-sequence-key';
import { NumberSequencesService } from './number-sequences.service';

describe('NumberSequencesService', () => {
  let service: NumberSequencesService;

  const tx = {
    $queryRaw: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NumberSequencesService();
  });

  // nextCode(sequenceKey) is typed as BusinessCodeSequenceKey only — arbitrary
  // HTTP-supplied keys cannot be passed at compile time. Runtime isApprovedSequenceKey
  // still rejects unknown strings when callers bypass types via cast.

  it('allocates PRODUCT codes via $queryRaw on the transaction client', async () => {
    tx.$queryRaw.mockResolvedValue([{ currentValue: 1n, padding: 7 }]);

    const code = await service.nextCode(tx, BusinessCodeSequenceKey.PRODUCT);

    expect(code).toBe('0000001');
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('allocates BUSINESS_PARTNER codes via $queryRaw on the transaction client', async () => {
    tx.$queryRaw.mockResolvedValue([{ currentValue: 2n, padding: 7 }]);

    const code = await service.nextCode(
      tx,
      BusinessCodeSequenceKey.BUSINESS_PARTNER,
    );

    expect(code).toBe('0000002');
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('allocates PURCHASE codes via $queryRaw on the transaction client', async () => {
    tx.$queryRaw.mockResolvedValue([{ currentValue: 5n, padding: 7 }]);

    const code = await service.nextCode(tx, BusinessCodeSequenceKey.PURCHASE);

    expect(code).toBe('0000005');
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('allocates SALE codes via $queryRaw on the transaction client', async () => {
    tx.$queryRaw.mockResolvedValue([{ currentValue: 6n, padding: 7 }]);

    const code = await service.nextCode(tx, BusinessCodeSequenceKey.SALE);

    expect(code).toBe('0000006');
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('passes independent sequence keys on separate allocations', async () => {
    tx.$queryRaw
      .mockResolvedValueOnce([{ currentValue: 3n, padding: 7 }])
      .mockResolvedValueOnce([{ currentValue: 4n, padding: 7 }]);

    await service.nextCode(tx, BusinessCodeSequenceKey.PRODUCT);
    await service.nextCode(tx, BusinessCodeSequenceKey.BUSINESS_PARTNER);

    expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('throws InternalServerErrorException when the sequence row is missing', async () => {
    tx.$queryRaw.mockResolvedValue([]);

    await expect(
      service.nextCode(tx as never, BusinessCodeSequenceKey.PRODUCT),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('rejects an unknown key at runtime when cast past the type system', async () => {
    await expect(
      service.nextCode(tx as never, 'INVOICE' as SequenceKey),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    expect(tx.$queryRaw).not.toHaveBeenCalled();
  });
});
