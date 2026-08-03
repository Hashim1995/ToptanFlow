import { describe, expect, it } from 'vitest';
import type { CashAccount } from '../api/cash.api';
import { findResponsibleCashAccountId } from './responsible-cash-account';

const account = (overrides: Partial<CashAccount>): CashAccount => ({
  id: 'account-1',
  name: 'Ofis kassası',
  code: 'CA-0000001',
  currentBalance: '0.00',
  notes: null,
  responsibleUserId: 'user-1',
  responsibleUserName: 'İstifadəçi',
  isActive: true,
  deactivatedAt: null,
  deactivationReason: null,
  createdAt: '2026-08-03T00:00:00+04:00',
  updatedAt: '2026-08-03T00:00:00+04:00',
  createdByUserId: 'admin-1',
  ...overrides,
});

describe('findResponsibleCashAccountId', () => {
  it('returns the logged-in user responsible active account', () => {
    expect(
      findResponsibleCashAccountId(
        [account({}), account({ id: 'account-2', responsibleUserId: 'user-2' })],
        'user-2',
      ),
    ).toBe('account-2');
  });

  it('does not default to an inactive account', () => {
    expect(findResponsibleCashAccountId([account({ isActive: false })], 'user-1')).toBe('');
  });
});
