import { describe, expect, it } from 'vitest';
import {
  debtBalanceSign,
  debtBalanceSignLabel,
  DEBT_BALANCE_SIGN_LABELS,
} from './debt-balance-label';

describe('debtBalanceSignLabel', () => {
  it('explains positive, negative, and zero balances', () => {
    expect(debtBalanceSign('1500')).toBe('positive');
    expect(debtBalanceSignLabel('1500')).toBe(DEBT_BALANCE_SIGN_LABELS.positive);
    expect(debtBalanceSign('-700')).toBe('negative');
    expect(debtBalanceSignLabel('-700')).toBe(DEBT_BALANCE_SIGN_LABELS.negative);
    expect(debtBalanceSign('0')).toBe('zero');
    expect(debtBalanceSignLabel('0.0000')).toBe(DEBT_BALANCE_SIGN_LABELS.zero);
  });
});
