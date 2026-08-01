import { useEffect, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Typography,
} from 'antd';
import {
  DATE_DISPLAY_FORMAT,
  bakuTodayDateOnly,
  dateOnlyPickerToApi,
  dateOnlyPickerValue,
} from '../../../shared/datetime';
import { DecimalInput } from '../../master-data/ui/decimal-input';
import { useBusinessPartnersList } from '../../master-data/api/business-partners.hooks';
import { useSalesList } from '../../sales/api/sales.hooks';
import { usePurchasesList } from '../../purchases/api/purchases.hooks';
import { formatMoney } from '../../../shared/money/format-money';
import type { CashAccount } from '../api/cash.api';
import {
  cashAccountFormSchema,
  cashInFormSchema,
  cashOutFormSchema,
  expenseCategoryFormSchema,
  expenseFormSchema,
  transferFormSchema,
  type CashAccountFormValues,
  type CashInFormValues,
  type CashOutFormValues,
  type ExpenseCategoryFormValues,
  type ExpenseFormValues,
  type TransferFormValues,
} from '../forms/cash.schemas';
import { useCashAccountsList, useExpenseCategoriesList } from '../api/cash.hooks';
import { CASH_LABELS } from './labels';
import {
  RELATED_DOC_NONE,
  buildRelatedDocumentOptions,
  relatedDocumentFormValue,
  relatedDocumentOptionRender,
  relatedDocumentSelectValue,
  type RelatedDocumentOptionData,
} from './related-document-option.helpers';

const { Text } = Typography;

function previewBalanceAfter(
  balanceBefore: string,
  amount: string,
  direction: 'IN' | 'OUT',
): number | null {
  const before = Number.parseFloat(balanceBefore);
  const value = Number.parseFloat(amount);
  if (!Number.isFinite(before) || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  const after = direction === 'IN' ? before + value : before - value;
  return Number.isFinite(after) ? after : null;
}

function previewPartnerDebtAfter(
  balanceBefore: string | undefined,
  amount: string,
  direction: 'IN' | 'OUT',
): number | null {
  const before = Number.parseFloat(balanceBefore ?? '');
  const value = Number.parseFloat(amount);
  if (!Number.isFinite(before) || !Number.isFinite(value) || value <= 0) {
    return null;
  }
  const after = direction === 'IN' ? before - value : before + value;
  return Number.isFinite(after) ? after : null;
}

type AccountModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  account?: CashAccount | null;
  submitting: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: CashAccountFormValues) => Promise<void>;
};

export function CashAccountFormModal({
  open,
  mode,
  account,
  submitting,
  error,
  onCancel,
  onSubmit,
}: AccountModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CashAccountFormValues>({
    resolver: zodResolver(cashAccountFormSchema),
    defaultValues: { name: '', notes: '', openingBalance: '' },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && account) {
      reset({
        name: account.name,
        notes: account.notes ?? '',
        openingBalance: '',
      });
    } else {
      reset({ name: '', notes: '', openingBalance: '' });
    }
  }, [open, mode, account, reset]);

  return (
    <Modal
      title={
        mode === 'create' ? CASH_LABELS.createAccount : CASH_LABELS.editAccount
      }
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={submitting}
      destroyOnHidden
      okText={CASH_LABELS.save}
      cancelText={CASH_LABELS.cancel}
      maskClosable={!submitting}
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message={error}
        />
      ) : null}
      <Form layout="vertical" requiredMark="optional">
        {mode === 'edit' && account ? (
          <Form.Item label={CASH_LABELS.columns.code} extra={CASH_LABELS.fields.codeHint}>
            <Input value={account.code} disabled />
          </Form.Item>
        ) : null}
        <Form.Item
          label={CASH_LABELS.fields.name}
          required
          validateStatus={errors.name ? 'error' : undefined}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={CASH_LABELS.fields.namePlaceholder}
                autoFocus
                maxLength={255}
              />
            )}
          />
        </Form.Item>
        {mode === 'create' ? (
          <Form.Item
            label={CASH_LABELS.fields.openingBalance}
            validateStatus={errors.openingBalance ? 'error' : undefined}
            help={
              errors.openingBalance?.message ||
              CASH_LABELS.fields.openingBalanceHint
            }
          >
            <Controller
              name="openingBalance"
              control={control}
              render={({ field }) => (
                <DecimalInput
                  {...field}
                  maxFractionDigits={2}
                  placeholder={CASH_LABELS.fields.openingBalancePlaceholder}
                  suffix="AZN"
                />
              )}
            />
          </Form.Item>
        ) : null}
        <Form.Item
          label={CASH_LABELS.fields.notes}
          validateStatus={errors.notes ? 'error' : undefined}
          help={errors.notes?.message}
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={3}
                maxLength={2000}
                showCount
                placeholder={CASH_LABELS.fields.notesPlaceholder}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

type CashInModalProps = {
  open: boolean;
  account: CashAccount | null;
  submitting: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: CashInFormValues) => Promise<void>;
};

export function CashInFormModal({
  open,
  account,
  submitting,
  error,
  onCancel,
  onSubmit,
}: CashInModalProps) {
  const partners = useBusinessPartnersList({
    page: 1,
    pageSize: 100,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const accounts = useCashAccountsList({
    page: 1,
    pageSize: 100,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CashInFormValues>({
    resolver: zodResolver(cashInFormSchema),
    defaultValues: {
      cashAccountId: '',
      partnerId: '',
      amount: '',
      transactionDate: bakuTodayDateOnly(),
      saleId: '',
      notes: '',
    },
  });

  const amount = useWatch({ control, name: 'amount' });
  const partnerId = useWatch({ control, name: 'partnerId' });
  const cashAccountId = useWatch({ control, name: 'cashAccountId' });
  const selectedPartner = partners.data?.data.find((p) => p.id === partnerId);
  const resolvedAccount =
    account ??
    accounts.data?.data.find((row) => row.id === cashAccountId) ??
    null;
  const sales = useSalesList(
    {
      page: 1,
      pageSize: 100,
      partnerId: partnerId || undefined,
      status: 'POSTED',
      sortBy: 'businessDate',
      sortOrder: 'desc',
    },
    { enabled: Boolean(partnerId) },
  );
  const saleDocuments = useMemo((): RelatedDocumentOptionData[] => {
    return (sales.data?.data ?? []).map((sale) => ({
      id: sale.id,
      documentNumber: sale.documentNumber,
      partnerName: sale.partner?.name ?? sale.partnerName ?? '—',
      partnerCode: sale.partner?.code ?? sale.partnerCode ?? '—',
      totalAmount: sale.totalAmount,
      transactionDate: sale.businessDate,
      hasLinkedCashOperation: Boolean(sale.hasLinkedCashOperation),
    }));
  }, [sales.data?.data]);
  const saleOptions = useMemo(
    () => buildRelatedDocumentOptions(saleDocuments),
    [saleDocuments],
  );
  const balanceAfter = useMemo(
    () =>
      resolvedAccount
        ? previewBalanceAfter(resolvedAccount.currentBalance, amount, 'IN')
        : null,
    [resolvedAccount, amount],
  );
  const partnerDebtAfter = useMemo(
    () =>
      previewPartnerDebtAfter(
        selectedPartner?.currentDebtBalance,
        amount,
        'IN',
      ),
    [selectedPartner?.currentDebtBalance, amount],
  );

  useEffect(() => {
    if (!open) return;
    reset({
      cashAccountId: account?.id ?? '',
      partnerId: '',
      amount: '',
      transactionDate: bakuTodayDateOnly(),
      saleId: '',
      notes: '',
    });
  }, [open, account, reset]);

  function submitWithConfirm(values: CashInFormValues) {
    Modal.confirm({
      title: CASH_LABELS.confirmations.cashInTitle,
      content: CASH_LABELS.confirmations.cashIn(
        formatMoney(values.amount),
        resolvedAccount?.name ?? '',
      ),
      okText: CASH_LABELS.confirm,
      cancelText: CASH_LABELS.cancel,
      onOk: () => onSubmit(values),
    });
  }

  return (
    <Modal
      title={CASH_LABELS.cashIn}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(submitWithConfirm)}
      confirmLoading={submitting}
      destroyOnHidden
      okText={CASH_LABELS.confirm}
      cancelText={CASH_LABELS.cancel}
      maskClosable={!submitting}
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message={error}
        />
      ) : null}
      {resolvedAccount ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={resolvedAccount.name}
          description={
            <Space direction="vertical" size={2}>
              <Text>
                {CASH_LABELS.preview.balanceBefore}:{' '}
                {formatMoney(resolvedAccount.currentBalance)}
              </Text>
              {balanceAfter !== null ? (
                <Text strong>
                  {CASH_LABELS.preview.balanceAfter}:{' '}
                  {formatMoney(balanceAfter)}
                </Text>
              ) : null}
              {selectedPartner ? (
                <Text>
                  {CASH_LABELS.preview.partnerDebtBefore}:{' '}
                  {formatMoney(selectedPartner.currentDebtBalance)}
                </Text>
              ) : null}
              {partnerDebtAfter !== null ? (
                <Text strong>
                  {CASH_LABELS.preview.partnerDebtAfter}:{' '}
                  {formatMoney(partnerDebtAfter)}
                </Text>
              ) : null}
            </Space>
          }
        />
      ) : null}
      <Form layout="vertical" requiredMark="optional">
        <Form.Item
          label={CASH_LABELS.fields.account}
          required
          validateStatus={errors.cashAccountId ? 'error' : undefined}
          help={errors.cashAccountId?.message}
        >
          <Controller
            name="cashAccountId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onChange={field.onChange}
                onBlur={field.onBlur}
                showSearch
                optionFilterProp="label"
                disabled={Boolean(account)}
                placeholder={CASH_LABELS.fields.accountPlaceholder}
                loading={accounts.isLoading}
                options={(accounts.data?.data ?? []).map((row) => ({
                  value: row.id,
                  label: `${row.name} (${formatMoney(row.currentBalance)})`,
                }))}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.partner}
          required
          validateStatus={errors.partnerId ? 'error' : undefined}
          help={errors.partnerId?.message}
        >
          <Controller
            name="partnerId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onChange={(value) => {
                  field.onChange(value ?? '');
                  setValue('saleId', '');
                }}
                onBlur={field.onBlur}
                showSearch
                optionFilterProp="label"
                placeholder={CASH_LABELS.fields.partnerPlaceholder}
                loading={partners.isLoading}
                options={(partners.data?.data ?? []).map((partner) => ({
                  value: partner.id,
                  label: `${partner.name} (${formatMoney(partner.currentDebtBalance)})`,
                }))}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.sale}
          required
          validateStatus={errors.saleId ? 'error' : undefined}
          help={errors.saleId?.message ?? CASH_LABELS.fields.relatedDocumentHint}
        >
          <Controller
            name="saleId"
            control={control}
            render={({ field }) => (
              <Select
                value={relatedDocumentSelectValue(field.value)}
                onChange={(value) =>
                  field.onChange(relatedDocumentFormValue(value))
                }
                onBlur={field.onBlur}
                allowClear
                showSearch
                filterOption={(input, option) => {
                  const haystack = String(
                    (option as { searchText?: string; label?: unknown })
                      ?.searchText ??
                      option?.label ??
                      '',
                  ).toLowerCase();
                  return haystack.includes(input.trim().toLowerCase());
                }}
                disabled={!partnerId}
                placeholder={CASH_LABELS.fields.noConnection}
                loading={sales.isLoading}
                options={saleOptions}
                optionRender={relatedDocumentOptionRender}
                labelRender={({ value }) => {
                  if (!value || value === RELATED_DOC_NONE) {
                    return CASH_LABELS.fields.noConnection;
                  }
                  const doc = saleDocuments.find((item) => item.id === value);
                  if (!doc) return CASH_LABELS.fields.noConnection;
                  return `${doc.documentNumber} · ${doc.partnerName} · ${formatMoney(doc.totalAmount)}`;
                }}
                popupMatchSelectWidth={false}
                styles={{
                  popup: {
                    root: { minWidth: 360, maxWidth: 'min(560px, 92vw)' },
                  },
                }}
                listHeight={360}
                notFoundContent={
                  !partnerId
                    ? CASH_LABELS.fields.partnerPlaceholder
                    : sales.isError
                      ? CASH_LABELS.relatedDocumentLoadError
                      : CASH_LABELS.emptyTxns
                }
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.amount}
          required
          validateStatus={errors.amount ? 'error' : undefined}
          help={errors.amount?.message}
        >
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <DecimalInput
                {...field}
                maxFractionDigits={2}
                placeholder={CASH_LABELS.fields.amountPlaceholder}
                suffix="AZN"
                autoFocus
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.transactionDate}
          required
          validateStatus={errors.transactionDate ? 'error' : undefined}
          help={errors.transactionDate?.message}
        >
          <Controller
            name="transactionDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                style={{ width: '100%' }}
                format={DATE_DISPLAY_FORMAT}
                allowClear={false}
                value={dateOnlyPickerValue(field.value)}
                onChange={(d) =>
                  field.onChange(dateOnlyPickerToApi(d))
                }
              />
            )}
          />
        </Form.Item>
        <Form.Item label={CASH_LABELS.fields.notes}>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={2}
                maxLength={2000}
                placeholder={CASH_LABELS.fields.notesPlaceholder}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

type CashOutModalProps = {
  open: boolean;
  account: CashAccount | null;
  submitting: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: CashOutFormValues) => Promise<void>;
};

export function CashOutFormModal({
  open,
  account,
  submitting,
  error,
  onCancel,
  onSubmit,
}: CashOutModalProps) {
  const partners = useBusinessPartnersList({
    page: 1,
    pageSize: 100,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const accounts = useCashAccountsList({
    page: 1,
    pageSize: 100,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CashOutFormValues>({
    resolver: zodResolver(cashOutFormSchema),
    defaultValues: {
      cashAccountId: '',
      partnerId: '',
      amount: '',
      transactionDate: bakuTodayDateOnly(),
      purchaseId: '',
      notes: '',
      negativeBalanceOverrideReason: '',
      balanceBefore: '',
    },
  });

  const amount = useWatch({ control, name: 'amount' });
  const partnerId = useWatch({ control, name: 'partnerId' });
  const cashAccountId = useWatch({ control, name: 'cashAccountId' });
  const selectedPartner = partners.data?.data.find((p) => p.id === partnerId);
  const resolvedAccount =
    account ??
    accounts.data?.data.find((row) => row.id === cashAccountId) ??
    null;
  const purchases = usePurchasesList(
    {
      page: 1,
      pageSize: 100,
      partnerId: partnerId || undefined,
      status: 'POSTED',
      sortBy: 'businessDate',
      sortOrder: 'desc',
    },
    { enabled: Boolean(partnerId) },
  );
  const purchaseDocuments = useMemo((): RelatedDocumentOptionData[] => {
    return (purchases.data?.data ?? []).map((purchase) => ({
      id: purchase.id,
      documentNumber: purchase.documentNumber,
      partnerName: purchase.partner?.name ?? purchase.partnerName ?? '—',
      partnerCode: purchase.partner?.code ?? purchase.partnerCode ?? '—',
      totalAmount: purchase.totalAmount,
      transactionDate: purchase.businessDate,
      hasLinkedCashOperation: Boolean(purchase.hasLinkedCashOperation),
    }));
  }, [purchases.data?.data]);
  const purchaseOptions = useMemo(
    () => buildRelatedDocumentOptions(purchaseDocuments),
    [purchaseDocuments],
  );
  const balanceAfter = useMemo(
    () =>
      resolvedAccount
        ? previewBalanceAfter(resolvedAccount.currentBalance, amount, 'OUT')
        : null,
    [resolvedAccount, amount],
  );
  const needsNegativeReason = balanceAfter !== null && balanceAfter < 0;
  const partnerDebtAfter = useMemo(
    () =>
      previewPartnerDebtAfter(
        selectedPartner?.currentDebtBalance,
        amount,
        'OUT',
      ),
    [selectedPartner?.currentDebtBalance, amount],
  );

  useEffect(() => {
    if (!open) return;
    reset({
      cashAccountId: account?.id ?? '',
      partnerId: '',
      amount: '',
      transactionDate: bakuTodayDateOnly(),
      purchaseId: '',
      notes: '',
      negativeBalanceOverrideReason: '',
      balanceBefore: account?.currentBalance ?? '',
    });
  }, [open, account, reset]);

  useEffect(() => {
    if (!resolvedAccount) return;
    setValue('balanceBefore', resolvedAccount.currentBalance);
  }, [resolvedAccount, setValue]);

  function submitWithConfirm(values: CashOutFormValues) {
    const willGoNegative = needsNegativeReason;
    Modal.confirm({
      title: CASH_LABELS.confirmations.cashOutTitle,
      content: willGoNegative
        ? CASH_LABELS.confirmations.cashOutNegative(
            formatMoney(values.amount),
            resolvedAccount?.name ?? '',
          )
        : CASH_LABELS.confirmations.cashOut(
            formatMoney(values.amount),
            resolvedAccount?.name ?? '',
          ),
      okText: CASH_LABELS.confirm,
      cancelText: CASH_LABELS.cancel,
      okButtonProps: willGoNegative ? { danger: true } : undefined,
      onOk: () => onSubmit(values),
    });
  }

  return (
    <Modal
      title={CASH_LABELS.cashOut}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(submitWithConfirm)}
      confirmLoading={submitting}
      destroyOnHidden
      okText={CASH_LABELS.confirm}
      cancelText={CASH_LABELS.cancel}
      maskClosable={!submitting}
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message={error}
        />
      ) : null}
      {resolvedAccount ? (
        <Alert
          type={needsNegativeReason ? 'warning' : 'info'}
          showIcon
          style={{ marginBottom: 12 }}
          message={resolvedAccount.name}
          description={
            <Space direction="vertical" size={2}>
              <Text>
                {CASH_LABELS.preview.balanceBefore}:{' '}
                {formatMoney(resolvedAccount.currentBalance)}
              </Text>
              {balanceAfter !== null ? (
                <Text
                  strong
                  type={balanceAfter < 0 ? 'danger' : undefined}
                >
                  {CASH_LABELS.preview.balanceAfter}:{' '}
                  {formatMoney(balanceAfter)}
                </Text>
              ) : null}
              {needsNegativeReason ? (
                <Text type="danger">{CASH_LABELS.preview.negativeWarning}</Text>
              ) : null}
              {selectedPartner ? (
                <Text>
                  {CASH_LABELS.preview.partnerDebtBefore}:{' '}
                  {formatMoney(selectedPartner.currentDebtBalance)}
                </Text>
              ) : null}
              {partnerDebtAfter !== null ? (
                <Text strong>
                  {CASH_LABELS.preview.partnerDebtAfter}:{' '}
                  {formatMoney(partnerDebtAfter)}
                </Text>
              ) : null}
            </Space>
          }
        />
      ) : null}
      <Form layout="vertical" requiredMark="optional">
        <Form.Item
          label={CASH_LABELS.fields.account}
          required
          validateStatus={errors.cashAccountId ? 'error' : undefined}
          help={errors.cashAccountId?.message}
        >
          <Controller
            name="cashAccountId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onChange={field.onChange}
                onBlur={field.onBlur}
                showSearch
                optionFilterProp="label"
                disabled={Boolean(account)}
                placeholder={CASH_LABELS.fields.accountPlaceholder}
                loading={accounts.isLoading}
                options={(accounts.data?.data ?? []).map((row) => ({
                  value: row.id,
                  label: `${row.name} (${formatMoney(row.currentBalance)})`,
                }))}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.partner}
          required
          validateStatus={errors.partnerId ? 'error' : undefined}
          help={errors.partnerId?.message}
        >
          <Controller
            name="partnerId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onChange={(value) => {
                  field.onChange(value ?? '');
                  setValue('purchaseId', '');
                }}
                onBlur={field.onBlur}
                showSearch
                optionFilterProp="label"
                placeholder={CASH_LABELS.fields.partnerPlaceholder}
                loading={partners.isLoading}
                options={(partners.data?.data ?? []).map((partner) => ({
                  value: partner.id,
                  label: `${partner.name} (${formatMoney(partner.currentDebtBalance)})`,
                }))}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.purchase}
          required
          validateStatus={errors.purchaseId ? 'error' : undefined}
          help={
            errors.purchaseId?.message ??
            CASH_LABELS.fields.relatedDocumentHint
          }
        >
          <Controller
            name="purchaseId"
            control={control}
            render={({ field }) => (
              <Select
                value={relatedDocumentSelectValue(field.value)}
                onChange={(value) =>
                  field.onChange(relatedDocumentFormValue(value))
                }
                onBlur={field.onBlur}
                allowClear
                showSearch
                filterOption={(input, option) => {
                  const haystack = String(
                    (option as { searchText?: string; label?: unknown })
                      ?.searchText ??
                      option?.label ??
                      '',
                  ).toLowerCase();
                  return haystack.includes(input.trim().toLowerCase());
                }}
                disabled={!partnerId}
                placeholder={CASH_LABELS.fields.noConnection}
                loading={purchases.isLoading}
                options={purchaseOptions}
                optionRender={relatedDocumentOptionRender}
                labelRender={({ value }) => {
                  if (!value || value === RELATED_DOC_NONE) {
                    return CASH_LABELS.fields.noConnection;
                  }
                  const doc = purchaseDocuments.find(
                    (item) => item.id === value,
                  );
                  if (!doc) return CASH_LABELS.fields.noConnection;
                  return `${doc.documentNumber} · ${doc.partnerName} · ${formatMoney(doc.totalAmount)}`;
                }}
                popupMatchSelectWidth={false}
                styles={{
                  popup: {
                    root: { minWidth: 360, maxWidth: 'min(560px, 92vw)' },
                  },
                }}
                listHeight={360}
                notFoundContent={
                  !partnerId
                    ? CASH_LABELS.fields.partnerPlaceholder
                    : purchases.isError
                      ? CASH_LABELS.relatedDocumentLoadError
                      : CASH_LABELS.emptyTxns
                }
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.amount}
          required
          validateStatus={errors.amount ? 'error' : undefined}
          help={errors.amount?.message}
        >
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <DecimalInput
                {...field}
                maxFractionDigits={2}
                placeholder={CASH_LABELS.fields.amountPlaceholder}
                suffix="AZN"
                autoFocus
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.transactionDate}
          required
          validateStatus={errors.transactionDate ? 'error' : undefined}
          help={errors.transactionDate?.message}
        >
          <Controller
            name="transactionDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                style={{ width: '100%' }}
                format={DATE_DISPLAY_FORMAT}
                allowClear={false}
                value={dateOnlyPickerValue(field.value)}
                onChange={(d) =>
                  field.onChange(dateOnlyPickerToApi(d))
                }
              />
            )}
          />
        </Form.Item>
        {needsNegativeReason ? (
          <Form.Item
            label={CASH_LABELS.fields.negativeReason}
            required
            validateStatus={
              errors.negativeBalanceOverrideReason ? 'error' : undefined
            }
            help={
              errors.negativeBalanceOverrideReason?.message ||
              CASH_LABELS.validation.reasonRequired
            }
          >
            <Controller
              name="negativeBalanceOverrideReason"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={2}
                  maxLength={2000}
                  placeholder={CASH_LABELS.fields.negativeReasonPlaceholder}
                />
              )}
            />
          </Form.Item>
        ) : null}
        <Form.Item label={CASH_LABELS.fields.notes}>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={2}
                maxLength={2000}
                placeholder={CASH_LABELS.fields.notesPlaceholder}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

type ExpenseModalProps = {
  open: boolean;
  account: CashAccount | null;
  submitting: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
};

export function ExpenseFormModal({
  open,
  account,
  submitting,
  error,
  onCancel,
  onSubmit,
}: ExpenseModalProps) {
  const categories = useExpenseCategoriesList({
    page: 1,
    pageSize: 100,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const accounts = useCashAccountsList({
    page: 1,
    pageSize: 100,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      cashAccountId: '',
      expenseCategoryId: '',
      amount: '',
      transactionDate: bakuTodayDateOnly(),
      notes: '',
      negativeBalanceOverrideReason: '',
      balanceBefore: '',
    },
  });

  const amount = useWatch({ control, name: 'amount' });
  const categoryId = useWatch({ control, name: 'expenseCategoryId' });
  const cashAccountId = useWatch({ control, name: 'cashAccountId' });
  const resolvedAccount =
    account ??
    accounts.data?.data.find((row) => row.id === cashAccountId) ??
    null;
  const balanceAfter = useMemo(
    () =>
      resolvedAccount
        ? previewBalanceAfter(resolvedAccount.currentBalance, amount, 'OUT')
        : null,
    [resolvedAccount, amount],
  );
  const needsNegativeReason = balanceAfter !== null && balanceAfter < 0;
  const categoryName =
    categories.data?.data.find((c) => c.id === categoryId)?.name ?? '';

  useEffect(() => {
    if (!open) return;
    reset({
      cashAccountId: account?.id ?? '',
      expenseCategoryId: '',
      amount: '',
      transactionDate: bakuTodayDateOnly(),
      notes: '',
      negativeBalanceOverrideReason: '',
      balanceBefore: account?.currentBalance ?? '',
    });
  }, [open, account, reset]);

  useEffect(() => {
    if (!resolvedAccount) return;
    setValue('balanceBefore', resolvedAccount.currentBalance);
  }, [resolvedAccount, setValue]);

  function submitWithConfirm(values: ExpenseFormValues) {
    Modal.confirm({
      title: CASH_LABELS.confirmations.expenseTitle,
      content: CASH_LABELS.confirmations.expense(
        formatMoney(values.amount),
        resolvedAccount?.name ?? '',
        categoryName || '—',
      ),
      okText: CASH_LABELS.confirm,
      cancelText: CASH_LABELS.cancel,
      okButtonProps: needsNegativeReason ? { danger: true } : undefined,
      onOk: () => onSubmit(values),
    });
  }

  return (
    <Modal
      title={CASH_LABELS.expense}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(submitWithConfirm)}
      confirmLoading={submitting}
      destroyOnHidden
      okText={CASH_LABELS.confirm}
      cancelText={CASH_LABELS.cancel}
      maskClosable={!submitting}
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message={error}
        />
      ) : null}
      {resolvedAccount ? (
        <Alert
          type={needsNegativeReason ? 'warning' : 'info'}
          showIcon
          style={{ marginBottom: 12 }}
          message={resolvedAccount.name}
          description={
            <Space direction="vertical" size={2}>
              <Text>
                {CASH_LABELS.preview.balanceBefore}:{' '}
                {formatMoney(resolvedAccount.currentBalance)}
              </Text>
              {balanceAfter !== null ? (
                <Text strong type={balanceAfter < 0 ? 'danger' : undefined}>
                  {CASH_LABELS.preview.balanceAfter}:{' '}
                  {formatMoney(balanceAfter)}
                </Text>
              ) : null}
            </Space>
          }
        />
      ) : null}
      <Form layout="vertical" requiredMark="optional">
        <Form.Item
          label={CASH_LABELS.fields.account}
          required
          validateStatus={errors.cashAccountId ? 'error' : undefined}
          help={errors.cashAccountId?.message}
        >
          <Controller
            name="cashAccountId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onChange={field.onChange}
                onBlur={field.onBlur}
                showSearch
                optionFilterProp="label"
                disabled={Boolean(account)}
                placeholder={CASH_LABELS.fields.accountPlaceholder}
                loading={accounts.isLoading}
                options={(accounts.data?.data ?? []).map((row) => ({
                  value: row.id,
                  label: `${row.name} (${formatMoney(row.currentBalance)})`,
                }))}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.expenseCategory}
          required
          validateStatus={errors.expenseCategoryId ? 'error' : undefined}
          help={errors.expenseCategoryId?.message}
        >
          <Controller
            name="expenseCategoryId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onChange={field.onChange}
                showSearch
                optionFilterProp="label"
                placeholder={CASH_LABELS.fields.expenseCategoryPlaceholder}
                loading={categories.isLoading}
                options={(categories.data?.data ?? []).map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.amount}
          required
          validateStatus={errors.amount ? 'error' : undefined}
          help={errors.amount?.message}
        >
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <DecimalInput
                {...field}
                maxFractionDigits={2}
                placeholder={CASH_LABELS.fields.amountPlaceholder}
                suffix="AZN"
                autoFocus
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.transactionDate}
          required
          validateStatus={errors.transactionDate ? 'error' : undefined}
          help={errors.transactionDate?.message}
        >
          <Controller
            name="transactionDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                style={{ width: '100%' }}
                format={DATE_DISPLAY_FORMAT}
                allowClear={false}
                value={dateOnlyPickerValue(field.value)}
                onChange={(d) =>
                  field.onChange(dateOnlyPickerToApi(d))
                }
              />
            )}
          />
        </Form.Item>
        {needsNegativeReason ? (
          <Form.Item
            label={CASH_LABELS.fields.negativeReason}
            required
            validateStatus={
              errors.negativeBalanceOverrideReason ? 'error' : undefined
            }
            help={
              errors.negativeBalanceOverrideReason?.message ||
              CASH_LABELS.validation.reasonRequired
            }
          >
            <Controller
              name="negativeBalanceOverrideReason"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={2}
                  maxLength={2000}
                  placeholder={CASH_LABELS.fields.negativeReasonPlaceholder}
                />
              )}
            />
          </Form.Item>
        ) : null}
        <Form.Item
          label={CASH_LABELS.fields.notes}
          required
          validateStatus={errors.notes ? 'error' : undefined}
          help={errors.notes?.message}
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={2}
                maxLength={2000}
                placeholder={CASH_LABELS.fields.notesPlaceholder}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

type TransferModalProps = {
  open: boolean;
  sourceAccount: CashAccount | null;
  submitting: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: TransferFormValues) => Promise<void>;
};

export function TransferFormModal({
  open,
  sourceAccount,
  submitting,
  error,
  onCancel,
  onSubmit,
}: TransferModalProps) {
  const accounts = useCashAccountsList({
    page: 1,
    pageSize: 100,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      sourceCashAccountId: '',
      destinationCashAccountId: '',
      amount: '',
      transactionDate: bakuTodayDateOnly(),
      notes: '',
      negativeBalanceOverrideReason: '',
      balanceBefore: '',
    },
  });

  const sourceCashAccountId = useWatch({
    control,
    name: 'sourceCashAccountId',
  });
  const destinationCashAccountId = useWatch({
    control,
    name: 'destinationCashAccountId',
  });
  const amount = useWatch({ control, name: 'amount' });
  const source =
    accounts.data?.data.find((row) => row.id === sourceCashAccountId) ??
    sourceAccount;
  const destination = accounts.data?.data.find(
    (row) => row.id === destinationCashAccountId,
  );

  const sourceBalanceAfter = useMemo(
    () =>
      source ? previewBalanceAfter(source.currentBalance, amount, 'OUT') : null,
    [source, amount],
  );
  const destinationBalanceAfter = useMemo(
    () =>
      destination
        ? previewBalanceAfter(destination.currentBalance, amount, 'IN')
        : null,
    [destination, amount],
  );
  const needsNegativeReason =
    sourceBalanceAfter !== null && sourceBalanceAfter < 0;

  useEffect(() => {
    if (!open) return;
    reset({
      sourceCashAccountId: sourceAccount?.id ?? '',
      destinationCashAccountId: '',
      amount: '',
      transactionDate: bakuTodayDateOnly(),
      notes: '',
      negativeBalanceOverrideReason: '',
      balanceBefore: sourceAccount?.currentBalance ?? '',
    });
  }, [open, sourceAccount, reset]);

  useEffect(() => {
    if (!source) return;
    setValue('balanceBefore', source.currentBalance);
  }, [source, setValue]);

  function submitWithConfirm(values: TransferFormValues) {
    Modal.confirm({
      title: CASH_LABELS.confirmations.transferTitle,
      content: CASH_LABELS.confirmations.transfer(
        formatMoney(values.amount),
        source?.name ?? '',
        destination?.name ?? '',
      ),
      okText: CASH_LABELS.confirm,
      cancelText: CASH_LABELS.cancel,
      okButtonProps: needsNegativeReason ? { danger: true } : undefined,
      onOk: () => onSubmit(values),
    });
  }

  return (
    <Modal
      title={CASH_LABELS.transfer}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(submitWithConfirm)}
      confirmLoading={submitting}
      destroyOnHidden
      okText={CASH_LABELS.confirm}
      cancelText={CASH_LABELS.cancel}
      maskClosable={!submitting}
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message={error}
        />
      ) : null}
      {source ? (
        <Alert
          type={needsNegativeReason ? 'warning' : 'info'}
          showIcon
          style={{ marginBottom: 12 }}
          message={CASH_LABELS.preview.totalCompanyCashUnchanged}
          description={
            <Space direction="vertical" size={2}>
              <Text>
                {CASH_LABELS.preview.sourceBalanceBefore}:{' '}
                {formatMoney(source.currentBalance)}
              </Text>
              {sourceBalanceAfter !== null ? (
                <Text
                  strong
                  type={sourceBalanceAfter < 0 ? 'danger' : undefined}
                >
                  {CASH_LABELS.preview.sourceBalanceAfter}:{' '}
                  {formatMoney(sourceBalanceAfter)}
                </Text>
              ) : null}
              {destination ? (
                <Text>
                  {CASH_LABELS.preview.destinationBalanceBefore}:{' '}
                  {formatMoney(destination.currentBalance)}
                </Text>
              ) : null}
              {destinationBalanceAfter !== null ? (
                <Text strong>
                  {CASH_LABELS.preview.destinationBalanceAfter}:{' '}
                  {formatMoney(destinationBalanceAfter)}
                </Text>
              ) : null}
              {needsNegativeReason ? (
                <Text type="danger">
                  {CASH_LABELS.preview.transferNegativeWarning}
                </Text>
              ) : null}
            </Space>
          }
        />
      ) : null}
      <Form layout="vertical" requiredMark="optional">
        <Form.Item
          label={CASH_LABELS.fields.sourceAccount}
          required
          validateStatus={errors.sourceCashAccountId ? 'error' : undefined}
          help={errors.sourceCashAccountId?.message}
        >
          <Controller
            name="sourceCashAccountId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onChange={field.onChange}
                onBlur={field.onBlur}
                showSearch
                optionFilterProp="label"
                placeholder={CASH_LABELS.fields.sourceAccountPlaceholder}
                loading={accounts.isLoading}
                options={(accounts.data?.data ?? []).map((account) => ({
                  value: account.id,
                  label: `${account.name} (${formatMoney(account.currentBalance)})`,
                }))}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.destinationAccount}
          required
          validateStatus={
            errors.destinationCashAccountId ? 'error' : undefined
          }
          help={errors.destinationCashAccountId?.message}
        >
          <Controller
            name="destinationCashAccountId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onChange={field.onChange}
                onBlur={field.onBlur}
                showSearch
                optionFilterProp="label"
                placeholder={CASH_LABELS.fields.destinationAccountPlaceholder}
                loading={accounts.isLoading}
                options={(accounts.data?.data ?? [])
                  .filter((account) => account.id !== sourceCashAccountId)
                  .map((account) => ({
                    value: account.id,
                    label: `${account.name} (${formatMoney(account.currentBalance)})`,
                  }))}
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.amount}
          required
          validateStatus={errors.amount ? 'error' : undefined}
          help={errors.amount?.message}
        >
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <DecimalInput
                {...field}
                maxFractionDigits={2}
                placeholder={CASH_LABELS.fields.amountPlaceholder}
                suffix="AZN"
                autoFocus
              />
            )}
          />
        </Form.Item>
        <Form.Item
          label={CASH_LABELS.fields.transactionDate}
          required
          validateStatus={errors.transactionDate ? 'error' : undefined}
          help={errors.transactionDate?.message}
        >
          <Controller
            name="transactionDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                style={{ width: '100%' }}
                format={DATE_DISPLAY_FORMAT}
                allowClear={false}
                value={dateOnlyPickerValue(field.value)}
                onChange={(d) =>
                  field.onChange(dateOnlyPickerToApi(d))
                }
              />
            )}
          />
        </Form.Item>
        {needsNegativeReason ? (
          <Form.Item
            label={CASH_LABELS.fields.negativeReason}
            required
            validateStatus={
              errors.negativeBalanceOverrideReason ? 'error' : undefined
            }
            help={
              errors.negativeBalanceOverrideReason?.message ||
              CASH_LABELS.validation.reasonRequired
            }
          >
            <Controller
              name="negativeBalanceOverrideReason"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={2}
                  maxLength={2000}
                  placeholder={CASH_LABELS.fields.negativeReasonPlaceholder}
                />
              )}
            />
          </Form.Item>
        ) : null}
        <Form.Item label={CASH_LABELS.fields.notes}>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={2}
                maxLength={2000}
                placeholder={CASH_LABELS.fields.notesPlaceholder}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

type ExpenseCategoryModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialName?: string;
  submitting: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: ExpenseCategoryFormValues) => Promise<void>;
};

export function ExpenseCategoryFormModal({
  open,
  mode,
  initialName,
  submitting,
  error,
  onCancel,
  onSubmit,
}: ExpenseCategoryModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseCategoryFormValues>({
    resolver: zodResolver(expenseCategoryFormSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!open) return;
    reset({ name: initialName ?? '' });
  }, [open, initialName, reset]);

  return (
    <Modal
      title={
        mode === 'create'
          ? CASH_LABELS.createExpenseCategory
          : CASH_LABELS.editExpenseCategory
      }
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={submitting}
      destroyOnHidden
      okText={CASH_LABELS.save}
      cancelText={CASH_LABELS.cancel}
    >
      {error ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message={error}
        />
      ) : null}
      <Form layout="vertical">
        <Form.Item
          label={CASH_LABELS.fields.name}
          required
          validateStatus={errors.name ? 'error' : undefined}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                autoFocus
                placeholder="Məsələn, Ofis xərcləri"
                maxLength={255}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
