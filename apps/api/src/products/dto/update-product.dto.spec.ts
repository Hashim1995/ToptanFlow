import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateProductDto } from './update-product.dto';
import { ProductTypeApi } from './product-type.enum';

describe('UpdateProductDto validation', () => {
  async function validateDto(body: Record<string, unknown>): Promise<string[]> {
    const dto = plainToInstance(UpdateProductDto, body);
    const errors = await validate(dto);
    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
  }

  it('allows an empty object at DTO level (service rejects empty PATCH)', async () => {
    const messages = await validateDto({});
    expect(messages).toHaveLength(0);
  });

  it('does not declare a code field', () => {
    expect(
      Object.getOwnPropertyDescriptor(UpdateProductDto.prototype, 'code'),
    ).toBeUndefined();
    const sample = plainToInstance(UpdateProductDto, { name: 'x' });
    expect(sample).not.toHaveProperty('code');
  });

  it('accepts isActive for reactivation', async () => {
    expect(await validateDto({ isActive: true })).toHaveLength(0);
    expect(await validateDto({ isActive: false })).toHaveLength(0);
  });

  it('rejects null for non-nullable fields', async () => {
    await expect(validateDto({ name: null })).resolves.not.toHaveLength(0);
    await expect(validateDto({ type: null })).resolves.not.toHaveLength(0);
    await expect(validateDto({ unitId: null })).resolves.not.toHaveLength(0);
  });

  it('allows null for nullable clearable fields', async () => {
    const messages = await validateDto({
      categoryId: null,
      standardSalePrice: null,
      latestPurchasePrice: null,
      criticalStockThreshold: null,
    });
    expect(messages).toHaveLength(0);
  });

  it('allows valid decimal null and rejects malformed decimals', async () => {
    expect(await validateDto({ standardSalePrice: null })).toHaveLength(0);
    await expect(
      validateDto({ standardSalePrice: '1e3' }),
    ).resolves.not.toHaveLength(0);
  });

  it('accepts a partial update with valid type', async () => {
    const messages = await validateDto({ type: ProductTypeApi.MIXED_USE });
    expect(messages).toHaveLength(0);
  });
});
