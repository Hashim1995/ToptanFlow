/**
 * ADR-030 signed debt balance explanation labels (Azerbaijani UI).
 */
export type DebtBalanceSign = 'positive' | 'negative' | 'zero';

export const DEBT_BALANCE_SIGN_LABELS = {
  positive: 'Tərəfdaş bizə borcludur',
  negative: 'Biz tərəfdaşa borcluyuq',
  zero: 'Borc yoxdur',
} as const satisfies Record<DebtBalanceSign, string>;

export function debtBalanceSign(amount: string | number): DebtBalanceSign {
  const numeric =
    typeof amount === 'number' ? amount : Number.parseFloat(amount);
  if (!Number.isFinite(numeric) || numeric === 0) {
    return 'zero';
  }
  return numeric > 0 ? 'positive' : 'negative';
}

export function debtBalanceSignLabel(amount: string | number): string {
  return DEBT_BALANCE_SIGN_LABELS[debtBalanceSign(amount)];
}
