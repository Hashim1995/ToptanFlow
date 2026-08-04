/**
 * Canonical Web Push event keys (CHANGE-032).
 * One key per completed business operation; messages are built server-side.
 */
export const PushEventKey = {
  CASH_IN: 'cash.cash_in',
  CASH_OUT: 'cash.cash_out',
  CASH_EXPENSE: 'cash.expense',
  CASH_TRANSFER: 'cash.transfer',
  CASH_TRANSFER_CANCEL: 'cash.transfer_cancel',
  CASH_TRANSACTION_CANCEL: 'cash.transaction_cancel',
  CASH_ACCOUNT_CREATED: 'cash.account_created',
  CASH_OPENING_BALANCE_CORRECTED: 'cash.opening_balance_corrected',
  SALE_CREATED: 'sale.created',
  SALE_POSTED: 'sale.posted',
  SALE_CANCELLED: 'sale.cancelled',
  PURCHASE_CREATED: 'purchase.created',
  PURCHASE_POSTED: 'purchase.posted',
  PURCHASE_CANCELLED: 'purchase.cancelled',
  INVENTORY_QUANTITY_ADJUSTED: 'inventory.quantity_adjusted',
} as const;

export type PushEventKeyValue =
  (typeof PushEventKey)[keyof typeof PushEventKey];

export const PUSH_NOTIFICATION_TITLE = 'TOPTANFLOW';
