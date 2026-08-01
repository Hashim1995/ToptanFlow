import { useMemo } from 'react';
import { Alert, Checkbox, Form, Input, Select, Space, Typography } from 'antd';
import { DecimalInput } from '../../master-data/ui/decimal-input';
import { useCashAccountsList } from '../../cash/api/cash.hooks';
import { CASH_LABELS } from '../../cash/ui/labels';
import { formatMoney } from '../../../shared/money/format-money';
import { PURCHASE_LABELS } from './labels';

const { Text } = Typography;

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

type PurchaseImmediatePaymentSectionProps = {
  value: PurchaseImmediatePaymentState;
  onChange: (next: PurchaseImmediatePaymentState) => void;
  documentTotal?: string;
  partnerDebtBalance?: string;
};

export function PurchaseImmediatePaymentSection({
  value,
  onChange,
  documentTotal = '',
  partnerDebtBalance = '',
}: PurchaseImmediatePaymentSectionProps) {
  const accounts = useCashAccountsList({
    page: 1,
    pageSize: 100,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const selectedAccount = useMemo(
    () => accounts.data?.data.find((row) => row.id === value.cashAccountId),
    [accounts.data?.data, value.cashAccountId],
  );

  const cashPreview = useMemo(() => {
    if (!selectedAccount || !value.enabled) return null;
    const before = Number.parseFloat(selectedAccount.currentBalance);
    const amount = Number.parseFloat(value.amount);
    if (!Number.isFinite(before) || !Number.isFinite(amount) || amount <= 0) {
      return null;
    }
    return { before, after: before - amount };
  }, [selectedAccount, value.enabled, value.amount]);

  const needsNegativeReason =
    cashPreview !== null && cashPreview.after < 0;

  const debtPreview = useMemo(() => {
    const before = Number.parseFloat(partnerDebtBalance);
    const purchaseTotal = Number.parseFloat(documentTotal);
    if (!Number.isFinite(before) || !Number.isFinite(purchaseTotal)) {
      return null;
    }
    const afterPurchase = before - purchaseTotal;
    if (!value.enabled) {
      return { before, after: afterPurchase };
    }
    const payment = Number.parseFloat(value.amount);
    if (!Number.isFinite(payment) || payment <= 0) {
      return { before, after: afterPurchase };
    }
    return { before, after: afterPurchase + payment };
  }, [partnerDebtBalance, documentTotal, value.enabled, value.amount]);

  return (
    <div>
      <Checkbox
        checked={value.enabled}
        onChange={(event) =>
          onChange({
            ...value,
            enabled: event.target.checked,
            amount:
              value.amount ||
              emptyPurchaseImmediatePayment(documentTotal).amount,
          })
        }
      >
        {PURCHASE_LABELS.post.payNow}
      </Checkbox>
      <Text type="secondary" style={{ display: 'block', marginTop: 4, fontSize: 12 }}>
        {PURCHASE_LABELS.post.payNowHint}
      </Text>

      {value.enabled ? (
        <Form layout="vertical" style={{ marginTop: 12 }} size="small">
          <Form.Item
            label={PURCHASE_LABELS.post.cashAccount}
            required
            validateStatus={!value.cashAccountId ? 'error' : undefined}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={PURCHASE_LABELS.post.cashAccountPlaceholder}
              value={value.cashAccountId}
              onChange={(cashAccountId) =>
                onChange({ ...value, cashAccountId })
              }
              options={(accounts.data?.data ?? []).map((account) => ({
                value: account.id,
                label: `${account.name} (${formatMoney(account.currentBalance)})`,
              }))}
              loading={accounts.isLoading}
            />
          </Form.Item>
          <Form.Item
            label={PURCHASE_LABELS.post.paymentAmount}
            required
            extra={PURCHASE_LABELS.post.paymentAmountHint}
          >
            <DecimalInput
              value={value.amount}
              onChange={(amount) => onChange({ ...value, amount })}
              maxFractionDigits={2}
              placeholder={PURCHASE_LABELS.post.paymentAmountPlaceholder}
              suffix="AZN"
            />
          </Form.Item>
          {needsNegativeReason ? (
            <Form.Item
              label={CASH_LABELS.fields.negativeReason}
              required
              validateStatus={
                !value.negativeBalanceOverrideReason.trim()
                  ? 'error'
                  : undefined
              }
            >
              <Input.TextArea
                value={value.negativeBalanceOverrideReason}
                onChange={(event) =>
                  onChange({
                    ...value,
                    negativeBalanceOverrideReason: event.target.value,
                  })
                }
                rows={2}
                maxLength={2000}
                placeholder={CASH_LABELS.fields.negativeReasonPlaceholder}
              />
            </Form.Item>
          ) : null}
          <Form.Item label={PURCHASE_LABELS.fields.notes}>
            <Input.TextArea
              value={value.notes}
              onChange={(event) =>
                onChange({ ...value, notes: event.target.value })
              }
              rows={2}
              maxLength={2000}
              placeholder={PURCHASE_LABELS.fields.notesPlaceholder}
            />
          </Form.Item>
        </Form>
      ) : null}

      {debtPreview ? (
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message={PURCHASE_LABELS.post.previewTitle}
          description={
            <Space direction="vertical" size={4}>
              <Text>
                {PURCHASE_LABELS.post.partnerDebtBefore}:{' '}
                {formatMoney(debtPreview.before)}
              </Text>
              <Text>
                {PURCHASE_LABELS.post.partnerDebtAfter}:{' '}
                {formatMoney(debtPreview.after)}
              </Text>
              {cashPreview ? (
                <>
                  <Text>
                    {PURCHASE_LABELS.post.cashBefore}:{' '}
                    {formatMoney(cashPreview.before)}
                  </Text>
                  <Text type={cashPreview.after < 0 ? 'danger' : undefined}>
                    {PURCHASE_LABELS.post.cashAfter}:{' '}
                    {formatMoney(cashPreview.after)}
                  </Text>
                </>
              ) : null}
            </Space>
          }
        />
      ) : null}
    </div>
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
