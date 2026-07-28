import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProductDto } from './create-product.dto';
import { ProductTypeApi } from './product-type.enum';

describe('CreateProductDto decimal validation', () => {
  const unitId = '22222222-2222-4222-8222-222222222222';

  async function validateDto(
    partial: Partial<CreateProductDto>,
  ): Promise<string[]> {
    const dto = plainToInstance(CreateProductDto, {
      name: 'Test',
      type: ProductTypeApi.FINISHED_GOOD,
      unitId,
      ...partial,
    });
    const errors = await validate(dto);
    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
  }

  it('CreateProductDto does not declare code', () => {
    expect(new CreateProductDto()).not.toHaveProperty('code');
    expect(
      Object.getOwnPropertyNames(CreateProductDto.prototype),
    ).not.toContain('code');
  });

  it('validates successfully without code (whitelist rejection is e2e)', async () => {
    const dto = plainToInstance(CreateProductDto, {
      name: 'Test',
      type: ProductTypeApi.FINISHED_GOOD,
      unitId,
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('accepts valid decimal strings', async () => {
    const messages = await validateDto({
      standardSalePrice: '12.5000',
      latestPurchasePrice: '0',
      criticalStockThreshold: '99999999999999.9999',
    });
    expect(messages).toHaveLength(0);
  });

  it('rejects negative and malformed decimal strings', async () => {
    await expect(
      validateDto({ standardSalePrice: '-1' }),
    ).resolves.not.toHaveLength(0);
    await expect(
      validateDto({ standardSalePrice: 'abc' }),
    ).resolves.not.toHaveLength(0);
    await expect(
      validateDto({ standardSalePrice: '12.12345' }),
    ).resolves.not.toHaveLength(0);
    await expect(
      validateDto({ standardSalePrice: '1e3' }),
    ).resolves.not.toHaveLength(0);
  });
});
