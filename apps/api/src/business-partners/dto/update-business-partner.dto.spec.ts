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

  it('does not declare a code field', () => {
    expect(new UpdateBusinessPartnerDto()).not.toHaveProperty('code');
    const sample = plainToInstance(UpdateBusinessPartnerDto, { name: 'x' });
    expect(sample).not.toHaveProperty('code');
  });

  it('does not declare currency fields', () => {
    expect(new UpdateBusinessPartnerDto()).not.toHaveProperty(
      'defaultCurrencyId',
    );
  });

  it('accepts isActive for reactivation', async () => {
    expect(await validateDto({ isActive: true })).toHaveLength(0);
    expect(await validateDto({ isActive: false })).toHaveLength(0);
  });

  it('rejects null for non-nullable fields', async () => {
    await expect(validateDto({ name: null })).resolves.not.toHaveLength(0);
    await expect(validateDto({ isCustomer: null })).resolves.not.toHaveLength(
      0,
    );
    await expect(validateDto({ isSupplier: null })).resolves.not.toHaveLength(
      0,
    );
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

  it('accepts partial role updates', async () => {
    expect(await validateDto({ isCustomer: false })).toHaveLength(0);
    expect(await validateDto({ isSupplier: true })).toHaveLength(0);
  });

  it('rejects invalid email', async () => {
    await expect(
      validateDto({ email: 'not-an-email' }),
    ).resolves.not.toHaveLength(0);
  });
});
