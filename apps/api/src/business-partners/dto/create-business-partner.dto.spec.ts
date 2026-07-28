import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateBusinessPartnerDto } from './create-business-partner.dto';
import { ListBusinessPartnersQueryDto } from './list-business-partners-query.dto';

describe('CreateBusinessPartnerDto validation', () => {
  const currencyId = '22222222-2222-4222-8222-222222222222';

  async function validateDto(
    partial: Record<string, unknown>,
  ): Promise<string[]> {
    const dto = plainToInstance(CreateBusinessPartnerDto, {
      name: 'Test',
      isCustomer: true,
      isSupplier: false,
      defaultCurrencyId: currencyId,
      ...partial,
    });
    const errors = await validate(dto);
    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
  }

  it('CreateBusinessPartnerDto does not declare code', () => {
    expect(new CreateBusinessPartnerDto()).not.toHaveProperty('code');
  });

  it('accepts valid customer-only, supplier-only, and both-role payloads', async () => {
    expect(
      await validateDto({ isCustomer: true, isSupplier: false }),
    ).toHaveLength(0);
    expect(
      await validateDto({ isCustomer: false, isSupplier: true }),
    ).toHaveLength(0);
    expect(
      await validateDto({ isCustomer: true, isSupplier: true }),
    ).toHaveLength(0);
  });

  it('rejects missing name and role flags', async () => {
    const missingName = plainToInstance(CreateBusinessPartnerDto, {
      isCustomer: true,
      isSupplier: false,
      defaultCurrencyId: currencyId,
    });
    expect((await validate(missingName)).length).toBeGreaterThan(0);

    const missingRoles = plainToInstance(CreateBusinessPartnerDto, {
      name: 'Test',
      defaultCurrencyId: currencyId,
    });
    expect((await validate(missingRoles)).length).toBeGreaterThan(0);
  });

  it('allows both-false at DTO level (service enforces role invariant)', async () => {
    // Both-false is a business invariant enforced in BusinessPartnersService
    // so clients receive a clear application message rather than a field-level
    // constraint message. DTO still requires boolean presence.
    const messages = await validateDto({
      isCustomer: false,
      isSupplier: false,
    });
    expect(messages).toHaveLength(0);
  });

  it('rejects invalid currency UUID and invalid email', async () => {
    await expect(
      validateDto({ defaultCurrencyId: 'not-a-uuid' }),
    ).resolves.not.toHaveLength(0);
    await expect(
      validateDto({ email: 'not-an-email' }),
    ).resolves.not.toHaveLength(0);
  });

  it('accepts nullable optional contact fields', async () => {
    const messages = await validateDto({
      phone: null,
      email: null,
      taxNumber: null,
      address: null,
      notes: null,
    });
    expect(messages).toHaveLength(0);
  });
});

describe('ListBusinessPartnersQueryDto validation', () => {
  async function validateQuery(
    partial: Record<string, unknown>,
  ): Promise<string[]> {
    const dto = plainToInstance(ListBusinessPartnersQueryDto, partial);
    const errors = await validate(dto);
    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
  }

  it('accepts defaults and transformed booleans', async () => {
    expect(await validateQuery({})).toHaveLength(0);
    expect(await validateQuery({ isActive: 'true' })).toHaveLength(0);
    expect(await validateQuery({ isCustomer: 'false' })).toHaveLength(0);
    expect(await validateQuery({ isSupplier: 'true' })).toHaveLength(0);
  });

  it('rejects invalid boolean strings, UUID, pagination, and sorting', async () => {
    await expect(
      validateQuery({ isActive: 'maybe' }),
    ).resolves.not.toHaveLength(0);
    await expect(
      validateQuery({ defaultCurrencyId: 'bad' }),
    ).resolves.not.toHaveLength(0);
    await expect(validateQuery({ page: 0 })).resolves.not.toHaveLength(0);
    await expect(validateQuery({ pageSize: 101 })).resolves.not.toHaveLength(0);
    await expect(validateQuery({ sortBy: 'phone' })).resolves.not.toHaveLength(
      0,
    );
    await expect(validateQuery({ sortOrder: 'up' })).resolves.not.toHaveLength(
      0,
    );
  });
});
