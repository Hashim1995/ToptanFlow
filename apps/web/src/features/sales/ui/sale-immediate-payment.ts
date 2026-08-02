export type SaleImmediatePaymentState = {
  enabled: boolean;
  cashAccountId?: string;
  amount: string;
  notes: string;
};

export function emptySaleImmediatePayment(
  documentTotal?: string,
): SaleImmediatePaymentState {
  const parsed = documentTotal ? Number.parseFloat(documentTotal) : NaN;
  return {
    enabled: false,
    cashAccountId: undefined,
    amount: Number.isFinite(parsed) ? parsed.toFixed(2) : '',
    notes: '',
  };
}

export function isSaleImmediatePaymentValid(
  payment: SaleImmediatePaymentState,
): boolean {
  if (!payment.enabled) return true;
  return (
    Boolean(payment.cashAccountId) &&
    Number.parseFloat(payment.amount) > 0 &&
    Number.isFinite(Number.parseFloat(payment.amount))
  );
}
