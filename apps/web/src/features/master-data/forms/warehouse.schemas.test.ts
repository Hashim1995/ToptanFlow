import { describe, expect, it } from 'vitest';
import { warehouseFormSchema } from './warehouse.schemas';

describe('warehouseFormSchema', () => {
  it('accepts valid create values', () => {
    const result = warehouseFormSchema.safeParse({
      name: 'Əsas anbar',
      kind: 'GENERAL',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = warehouseFormSchema.safeParse({
      name: '   ',
      kind: 'DAMAGED',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown kind', () => {
    const result = warehouseFormSchema.safeParse({
      name: 'Anbar',
      kind: 'VEHICLE',
    });
    expect(result.success).toBe(false);
  });
});
