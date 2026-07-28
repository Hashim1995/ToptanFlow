import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateBusinessPartnerDto } from './update-business-partner.dto';

describe('UpdateBusinessPartnerDto validation', () => {
  async function validateDto(body: Record<string, unknown>): Promise<string[]> {
    const dto = plainToInstance(UpdateBusinessPartnerDto, body);
    const errors = await validate(dto);
    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
  }

  it('allows an empty object at DTO level (service rejects empty PATCH)', async () => {
    const messages = await validateDto({});
    expect(messages).toHaveLength(0);
  });

  it('does not declare code or isActive', () => {
    expect(new UpdateBusinessPartnerDto()).not.toHaveProperty('code');
    expect(new UpdateBusinessPartnerDto()).not.toHaveProperty('isActive');
    const sample = plainToInstance(UpdateBusinessPartnerDto, { name: 'x' });
    expect(sample).not.toHaveProperty('code');
    expect(sample).not.toHaveProperty('isActive');
  });

  it('rejects null for non-nullable fields', async () => {
    await expect(validateDto({ name: null })).resolves.not.toHaveLength(0);
    await expect(validateDto({ isCustomer: null })).resolves.not.toHaveLength(
      0,
    );
    await expect(validateDto({ isSupplier: null })).resolves.not.toHaveLength(
      0,
    );
    await expect(
      validateDto({ defaultCurrencyId: null }),
    ).resolves.not.toHaveLength(0);
  });

  it('allows null for nullable clearable contact fields', async () => {
    const messages = await validateDto({
      phone: null,
      email: null,
      taxNumber: null,
      address: null,
      notes: null,
    });
    expect(messages).toHaveLength(0);
  });

  it('accepts partial role and currency updates', async () => {
    expect(await validateDto({ isCustomer: false })).toHaveLength(0);
    expect(
      await validateDto({
        defaultCurrencyId: '22222222-2222-4222-8222-222222222222',
      }),
    ).toHaveLength(0);
  });

  it('rejects invalid email and currency UUID', async () => {
    await expect(
      validateDto({ email: 'not-an-email' }),
    ).resolves.not.toHaveLength(0);
    await expect(
      validateDto({ defaultCurrencyId: 'bad' }),
    ).resolves.not.toHaveLength(0);
  });
});
