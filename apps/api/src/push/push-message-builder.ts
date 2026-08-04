import { BASE_CURRENCY } from '../common/money/base-currency.js';

/** Format money for push bodies: always two decimal places (e.g. `250.00`). */
export function formatPushMoney(amount: string | number): string {
  const n =
    typeof amount === 'number' ? amount : Number.parseFloat(String(amount));
  if (!Number.isFinite(n)) {
    return '0.00';
  }
  return n.toFixed(2);
}

export function resolveActorDisplayName(input: {
  fullName?: string | null;
  username?: string | null;
}): string {
  const full = input.fullName?.trim();
  if (full) return full;
  const username = input.username?.trim();
  if (username) return username;
  return 'İstifadəçi';
}

export function buildCashInBody(input: {
  actorName: string;
  amount: string | number;
  accountName: string;
  currency?: string;
}): string {
  const currency = input.currency?.trim() || BASE_CURRENCY;
  return `${input.actorName} — Kassa mədaxili: ${formatPushMoney(input.amount)} ${currency} · ${input.accountName}`;
}

export function buildCashOutBody(input: {
  actorName: string;
  amount: string | number;
  accountName: string;
  currency?: string;
}): string {
  const currency = input.currency?.trim() || BASE_CURRENCY;
  return `${input.actorName} — Kassa məxarici: ${formatPushMoney(input.amount)} ${currency} · ${input.accountName}`;
}

export function buildCashExpenseBody(input: {
  actorName: string;
  amount: string | number;
  accountName: string;
  currency?: string;
}): string {
  const currency = input.currency?.trim() || BASE_CURRENCY;
  return `${input.actorName} — Kassa xərci: ${formatPushMoney(input.amount)} ${currency} · ${input.accountName}`;
}

export function buildCashTransferBody(input: {
  actorName: string;
  amount: string | number;
  sourceAccountName: string;
  destinationAccountName: string;
  currency?: string;
}): string {
  const currency = input.currency?.trim() || BASE_CURRENCY;
  return `${input.actorName} — Transfer: ${formatPushMoney(input.amount)} ${currency} · ${input.sourceAccountName} → ${input.destinationAccountName}`;
}

export function buildCashTransferCancelBody(input: {
  actorName: string;
  transferNumber: string;
}): string {
  return `${input.actorName} kassa transferini ləğv etdi: ${input.transferNumber}`;
}

export function buildCashTransactionCancelBody(input: {
  actorName: string;
  transactionNumber: string;
}): string {
  return `${input.actorName} kassa əməliyyatını ləğv etdi: ${input.transactionNumber}`;
}

export function buildCashAccountCreatedBody(input: {
  actorName: string;
  accountName: string;
}): string {
  return `${input.actorName} yeni kassa hesabı yaratdı: ${input.accountName}`;
}

export function buildOpeningBalanceCorrectedBody(input: {
  actorName: string;
  accountName: string;
}): string {
  return `${input.actorName} kassa açılış qalığını düzəltdi: ${input.accountName}`;
}

export function buildSaleCreatedBody(input: { actorName: string }): string {
  return `${input.actorName} yeni satış fakturası yaratdı.`;
}

export function buildSalePostedBody(input: {
  actorName: string;
  documentNumber: string;
  amount: string | number;
  currency?: string;
}): string {
  const currency = input.currency?.trim() || BASE_CURRENCY;
  return `${input.actorName} satış fakturasını təsdiqlədi: ${input.documentNumber} · ${formatPushMoney(input.amount)} ${currency}`;
}

export function buildSaleCancelledBody(input: {
  actorName: string;
  documentNumber: string;
}): string {
  return `${input.actorName} satış fakturasını ləğv etdi: ${input.documentNumber}`;
}

export function buildPurchaseCreatedBody(input: { actorName: string }): string {
  return `${input.actorName} yeni alış fakturası yaratdı.`;
}

export function buildPurchasePostedBody(input: {
  actorName: string;
  documentNumber: string;
  amount: string | number;
  currency?: string;
}): string {
  const currency = input.currency?.trim() || BASE_CURRENCY;
  return `${input.actorName} alış fakturasını təsdiqlədi: ${input.documentNumber} · ${formatPushMoney(input.amount)} ${currency}`;
}

export function buildPurchaseCancelledBody(input: {
  actorName: string;
  documentNumber: string;
}): string {
  return `${input.actorName} alış fakturasını ləğv etdi: ${input.documentNumber}`;
}

export function buildInventoryAdjustedBody(input: {
  actorName: string;
}): string {
  return `${input.actorName} məhsul miqdarını düzəltdi.`;
}
