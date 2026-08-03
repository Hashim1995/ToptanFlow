import type { CashAccount } from '../api/cash.api';

/**
 * Ownership supplies a convenient default only. Users may still select any
 * other active Cash Account for an operation (ADR-040 / CHANGE-019).
 */
export function findResponsibleCashAccountId(
  accounts: readonly CashAccount[] | undefined,
  userId: string | undefined,
): string {
  if (!userId) return '';
  return (
    accounts?.find(
      (account) => account.isActive && account.responsibleUserId === userId,
    )?.id ?? ''
  );
}
