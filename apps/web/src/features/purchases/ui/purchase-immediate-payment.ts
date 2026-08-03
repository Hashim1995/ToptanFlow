export type PurchaseImmediatePaymentState = {
  enabled: boolean;
  cashAccountId?: string;
  amount: string;
  notes: string;
  negativeBalanceOverrideReason: string;
};

export function emptyPurchaseImmediatePayment(
  documentTotal?: string,
): PurchaseImmediatePaymentState {
  const parsed = documentTotal ? Number.parseFloat(documentTotal) : NaN;
  return {
    enabled: false,
    cashAccountId: undefined,
    amount: Number.isFinite(parsed) ? parsed.toFixed(2) : '',
    notes: '',
    negativeBalanceOverrideReason: '',
  };
}

export function isPurchaseImmediatePaymentValid(
  payment: PurchaseImmediatePaymentState,
  needsNegativeReason: boolean,
): boolean {
  if (!payment.enabled) return true;
  return (
    Boolean(payment.cashAccountId) &&
    Number.parseFloat(payment.amount) > 0 &&
    Number.isFinite(Number.parseFloat(payment.amount)) &&
    (!needsNegativeReason ||
      Boolean(payment.negativeBalanceOverrideReason.trim()))
  );
}

export function purchaseNeedsNegativeReason(
  payment: PurchaseImmediatePaymentState,
  accountBalance: string | undefined,
): boolean {
  if (!payment.enabled || !accountBalance) return false;
  const before = Number.parseFloat(accountBalance);
  const amount = Number.parseFloat(payment.amount);
  if (!Number.isFinite(before) || !Number.isFinite(amount) || amount <= 0) {
    return false;
  }
  return before - amount < 0;
}
