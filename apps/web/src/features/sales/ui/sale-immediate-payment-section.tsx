import { useMemo } from 'react';
import { Alert, Checkbox, Form, Input, Select, Space, Typography } from 'antd';
import { DecimalInput } from '../../master-data/ui/decimal-input';
import { useCashAccountsList } from '../../cash/api/cash.hooks';
import { formatMoney } from '../../../shared/money/format-money';
import { appRequiredMark } from '../../../shared/ui/form-required-mark';
import { SALES_LABELS } from './labels';
import {
  emptySaleImmediatePayment,
  type SaleImmediatePaymentState,
} from './sale-immediate-payment';

const { Text } = Typography;

type SaleImmediatePaymentSectionProps = {
  value: SaleImmediatePaymentState;
  onChange: (next: SaleImmediatePaymentState) => void;
  documentTotal?: string;
  partnerDebtBalance?: string;
};

export function SaleImmediatePaymentSection({
  value,
  onChange,
  documentTotal = '',
  partnerDebtBalance = '',
}: SaleImmediatePaymentSectionProps) {
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
    return { before, after: before + amount };
  }, [selectedAccount, value.enabled, value.amount]);

  const debtPreview = useMemo(() => {
    const before = Number.parseFloat(partnerDebtBalance);
    const saleTotal = Number.parseFloat(documentTotal);
    if (!Number.isFinite(before) || !Number.isFinite(saleTotal)) return null;
    const afterSale = before + saleTotal;
    if (!value.enabled) {
      return { before, after: afterSale };
    }
    const payment = Number.parseFloat(value.amount);
    if (!Number.isFinite(payment) || payment <= 0) {
      return { before, after: afterSale };
    }
    return { before, after: afterSale - payment };
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
              value.amount || emptySaleImmediatePayment(documentTotal).amount,
          })
        }
      >
        {SALES_LABELS.post.acceptPayment}
      </Checkbox>
      <Text
        type="secondary"
        style={{ display: 'block', marginTop: 4, fontSize: 12 }}
      >
        {SALES_LABELS.post.acceptPaymentHint}
      </Text>

      {value.enabled ? (
        <Form
          layout="vertical"
          requiredMark={appRequiredMark}
          style={{ marginTop: 12 }}
        >
          <Form.Item
            label={SALES_LABELS.post.cashAccount}
            required
            validateStatus={!value.cashAccountId ? 'error' : undefined}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={SALES_LABELS.post.cashAccountPlaceholder}
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
            label={SALES_LABELS.post.paymentAmount}
            required
            extra={SALES_LABELS.post.paymentAmountHint}
          >
            <DecimalInput
              value={value.amount}
              onChange={(amount) => onChange({ ...value, amount })}
              maxFractionDigits={2}
              placeholder={SALES_LABELS.post.paymentAmountPlaceholder}
              suffix="AZN"
            />
          </Form.Item>
          <Form.Item label={SALES_LABELS.fields.notes}>
            <Input.TextArea
              value={value.notes}
              onChange={(event) =>
                onChange({ ...value, notes: event.target.value })
              }
              rows={2}
              maxLength={2000}
              placeholder={SALES_LABELS.fields.notesPlaceholder}
            />
          </Form.Item>
        </Form>
      ) : null}

      {debtPreview ? (
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message={SALES_LABELS.post.previewTitle}
          description={
            <Space direction="vertical" size={4}>
              <Text>
                {SALES_LABELS.post.partnerDebtBefore}:{' '}
                {formatMoney(debtPreview.before)}
              </Text>
              <Text>
                {SALES_LABELS.post.partnerDebtAfter}:{' '}
                {formatMoney(debtPreview.after)}
              </Text>
              {cashPreview ? (
                <>
                  <Text>
                    {SALES_LABELS.post.cashBefore}:{' '}
                    {formatMoney(cashPreview.before)}
                  </Text>
                  <Text>
                    {SALES_LABELS.post.cashAfter}:{' '}
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
