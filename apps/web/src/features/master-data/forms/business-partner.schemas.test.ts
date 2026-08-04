import { describe, expect, it } from 'vitest';
import { businessPartnerFormSchema } from './business-partner.schemas';

const validBase = {
  name: 'Müştəri MMC',
  isCustomer: true,
  isSupplier: false,
  phone: '',
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

  it('accepts optional phone', () => {
    const result = businessPartnerFormSchema.safeParse({
      ...validBase,
      phone: '+994501234567',
    });
    expect(result.success).toBe(true);
  });

  it('does not require currency fields', () => {
    expect(validBase).not.toHaveProperty('defaultCurrencyId');
    const result = businessPartnerFormSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });
});
