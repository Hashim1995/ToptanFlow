import { describe, expect, it } from 'vitest';
import { BASE_CURRENCY, formatMoney } from './format-money';
import {
  DEBT_BALANCE_SIGN_LABELS,
  debtBalanceSign,
  debtBalanceSignLabel,
} from './debt-balance-label';

describe('formatMoney', () => {
  it('formats integers with grouping and AZN', () => {
    expect(formatMoney(1250)).toBe(`1,250.00 ${BASE_CURRENCY}`);
  });

  it('formats decimal strings with two display places', () => {
    expect(formatMoney('1250.5000')).toBe(`1,250.50 ${BASE_CURRENCY}`);
  });

  it('formats negative balances', () => {
    expect(formatMoney('-600.2500')).toBe(`-600.25 ${BASE_CURRENCY}`);
  });

  it('falls back for non-finite input', () => {
    expect(formatMoney('not-a-number')).toBe(`0.00 ${BASE_CURRENCY}`);
  });
});

describe('debtBalanceSignLabel', () => {
  it('explains positive balance', () => {
    expect(debtBalanceSign('100.0000')).toBe('positive');
    expect(debtBalanceSignLabel('100.0000')).toBe(
      DEBT_BALANCE_SIGN_LABELS.positive,
    );
    expect(debtBalanceSignLabel('100.0000')).toBe('Tərəfdaş bizə borcludur');
  });

  it('explains negative balance', () => {
    expect(debtBalanceSign(-50)).toBe('negative');
    expect(debtBalanceSignLabel('-50.0000')).toBe(
      'Biz tərəfdaşa borcluyuq',
    );
  });

  it('explains zero balance', () => {
    expect(debtBalanceSign('0.0000')).toBe('zero');
    expect(debtBalanceSignLabel(0)).toBe('Borc yoxdur');
  });
});
