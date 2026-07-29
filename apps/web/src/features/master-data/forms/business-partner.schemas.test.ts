import { describe, expect, it } from 'vitest';
import { businessPartnerFormSchema } from './business-partner.schemas';

const validBase = {
  name: 'Müştəri MMC',
  isCustomer: true,
  isSupplier: false,
  defaultCurrencyId: '11111111-1111-4111-8111-111111111111',
  phone: '',
  email: '',
  taxNumber: '',
  address: '',
  notes: '',
};

describe('businessPartnerFormSchema', () => {
  it('accepts a valid customer partner', () => {
    const result = businessPartnerFormSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it('rejects when neither customer nor supplier is selected', () => {
    const result = businessPartnerFormSchema.safeParse({
      ...validBase,
      isCustomer: false,
      isSupplier: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('isCustomer'))).toBe(
        true,
      );
    }
  });

  it('rejects empty name', () => {
    const result = businessPartnerFormSchema.safeParse({
      ...validBase,
      name: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email when provided', () => {
    const result = businessPartnerFormSchema.safeParse({
      ...validBase,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty email', () => {
    const result = businessPartnerFormSchema.safeParse({
      ...validBase,
      email: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid default currency', () => {
    const result = businessPartnerFormSchema.safeParse({
      ...validBase,
      defaultCurrencyId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});
