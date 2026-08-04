import { useEffect, useMemo, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Form,
  Input,
  Modal,
  Select,
  Typography,
} from 'antd';
import type { FormProps } from 'antd';
import {
  ArrowDown,
  ArrowUp,
  ArrowsLeftRight,
  Receipt,
  Tag as TagIcon,
  Wallet,
} from '@phosphor-icons/react';
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
import { useUsersList } from '../../users/api/users.hooks';
import { useAuth } from '../../auth/use-auth';
import { formatMoney } from '../../../shared/money/format-money';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import { ResponsiveDatePicker } from '../../../shared/ui/responsive-date-pickers';
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
import {
  useCashAccountsList,
  useExpenseCategoriesList,
} from '../api/cash.hooks';
import { CASH_LABELS } from './labels';
import {
  RELATED_DOC_NONE,
  buildRelatedDocumentOptions,
  relatedDocumentFormValue,
  relatedDocumentOptionRender,
  relatedDocumentSelectValue,
  type RelatedDocumentOptionData,
} from './related-document-option.helpers';
import './cash-modals.css';
import { findResponsibleCashAccountId } from './responsible-cash-account';

const { Text } = Typography;

const cashRequiredMark: Exclude<
  FormProps['requiredMark'],
  boolean | 'optional' | undefined
> = (label, { required }) => (
  <span className="cash-field-label">
    <span>{label}</span>
    {required ? (
      <span
        className="cash-required-mark"
        aria-label={CASH_LABELS.requiredField}
        title={CASH_LABELS.requiredField}
      >
        *
      </span>
    ) : (
      <span className="cash-optional-mark">{CASH_LABELS.optionalField}</span>
    )}
  </span>
);

type CashModalTone = 'default' | 'in' | 'out' | 'expense' | 'transfer';

type CashModalTitleProps = {
  title: string;
  description: string;
  icon: ReactNode;
  tone?: CashModalTone;
};

function CashModalTitle({
  title,
  description,
  icon,
  tone = 'default',
}: CashModalTitleProps) {
  return (
    <div className={`cash-modal-title cash-modal-title-${tone}`}>
      <span className="cash-modal-title-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="cash-modal-title-copy">
        <span className="cash-modal-title-text">{title}</span>
        <span className="cash-modal-title-description">{description}</span>
      </span>
    </div>
  );
}

type CashModalPreviewProps = {
  title: string;
  tone: Exclude<CashModalTone, 'default'>;
  warning?: boolean;
  notice?: ReactNode;
  children: ReactNode;
};

function CashModalPreview({
  title,
  tone,
  warning = false,
  notice,
  children,
}: CashModalPreviewProps) {
  return (
    <section
      className={`cash-modal-preview cash-modal-preview-${tone}${
        warning ? ' cash-modal-preview-warning' : ''
      }`}
    >
      <div className="cash-modal-preview-header">
        <span className="cash-modal-preview-dot" aria-hidden="true" />
        <Text strong className="cash-modal-preview-title">
          {title}
        </Text>
      </div>
      <div className="cash-modal-preview-grid">{children}</div>
      {notice}
    </section>
  );
}

type CashPreviewItemProps = {
  label: string;
  value: string;
  emphasis?: boolean;
  danger?: boolean;
};

function CashPreviewItem({
  label,
  value,
  emphasis = false,
  danger = false,
}: CashPreviewItemProps) {
  return (
    <div className="cash-preview-item">
      <Text type="secondary" className="cash-preview-label">
        {label}
      </Text>
      <Text
        className={`cash-preview-value${
          emphasis ? ' cash-preview-value-emphasis' : ''
        }${danger ? ' cash-preview-value-danger' : ''}`}
      >
        {value}
      </Text>
    </div>
  );
}

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

function useResponsibleDefaultAccountId(
  accounts: readonly CashAccount[] | undefined,
): string {
  const { user } = useAuth();
  return useMemo(
    () => findResponsibleCashAccountId(accounts, user?.id),
    [accounts, user?.id],
  );
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
  const { user } = useAuth();
  const canManageOwnership = Boolean(user?.isSuperAdmin);
  const users = useUsersList(
    {
      page: 1,
      pageSize: 100,
      isActive: true,
      sortBy: 'fullName',
      sortOrder: 'asc',
    },
    open && canManageOwnership,
  );
  const ownedAccounts = useCashAccountsList({ page: 1, pageSize: 100 });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CashAccountFormValues>({
    resolver: zodResolver(cashAccountFormSchema),
    defaultValues: {
      name: '',
      notes: '',
      openingBalance: '',
      responsibleUserId: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && account) {
      reset({
        name: account.name,
        notes: account.notes ?? '',
        openingBalance: '',
        responsibleUserId: account.responsibleUserId,
      });
    } else {
      reset({
        name: '',
        notes: '',
        openingBalance: '',
        responsibleUserId: '',
      });
    }
  }, [open, mode, account, reset]);

  return (
    <Modal
      title={
        <CashModalTitle
          title={
            mode === 'create'
              ? CASH_LABELS.createAccount
              : CASH_LABELS.editAccount
          }
          description={
            mode === 'create'
              ? CASH_LABELS.modalDescriptions.accountCreate
              : CASH_LABELS.modalDescriptions.accountEdit
          }
          icon={phIcon(Wallet, { size: ICON_SIZE.lg, weight: 'duotone' })}
        />
      }
      className="cash-form-modal cash-account-form-modal"
      wrapClassName="cash-form-modal-wrap"
      width={620}
      centered
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
          className="cash-modal-error"
          type="error"
          showIcon
          message={error}
        />
      ) : null}
      <Form
        className="cash-modal-form"
        layout="vertical"
        requiredMark={cashRequiredMark}
      >
        <div className="cash-form-grid">
          {mode === 'edit' && account ? (
            <Form.Item
              className="cash-form-field-readonly"
              label={CASH_LABELS.columns.code}
              extra={CASH_LABELS.fields.codeHint}
            >
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
            label={CASH_LABELS.fields.responsibleUser}
            required
            validateStatus={errors.responsibleUserId ? 'error' : undefined}
            help={errors.responsibleUserId?.message}
            extra={
              canManageOwnership
                ? CASH_LABELS.fields.responsibleUserHint
                : CASH_LABELS.fields.responsibleUserAdminHint
            }
          >
            <Controller
              name="responsibleUserId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  showSearch
                  optionFilterProp="label"
                  disabled={!canManageOwnership}
                  loading={users.isLoading}
                  placeholder={CASH_LABELS.fields.responsibleUserPlaceholder}
                  options={
                    canManageOwnership
                      ? (users.data?.data ?? [])
                          .filter((candidate) => {
                            const assigned = ownedAccounts.data?.data.find(
                              (row) =>
                                row.responsibleUserId === candidate.id &&
                                row.id !== account?.id,
                            );
                            return !assigned;
                          })
                          .map((candidate) => ({
                            value: candidate.id,
                            label: `${candidate.fullName} (${candidate.username})`,
                          }))
                      : account
                        ? [
                            {
                              value: account.responsibleUserId,
                              label: account.responsibleUserName,
                            },
                          ]
                        : []
                  }
                />
              )}
            />
          </Form.Item>
          <Form.Item
            className="cash-form-field-wide"
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
        </div>
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
  const responsibleAccountId = useResponsibleDefaultAccountId(
    accounts.data?.data,
  );

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
    accounts.data?.data.find((row) => row.id === cashAccountId) ?? account;
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
      cashAccountId: responsibleAccountId || account?.id || '',
      partnerId: '',
      amount: '',
      transactionDate: bakuTodayDateOnly(),
      saleId: '',
      notes: '',
    });
  }, [open, account, responsibleAccountId, reset]);

  function submitWithConfirm(values: CashInFormValues) {
    Modal.confirm({
      className: 'cash-confirm-modal cash-confirm-modal-in',
      centered: true,
      width: 440,
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
      title={
        <CashModalTitle
          title={CASH_LABELS.cashIn}
          description={CASH_LABELS.modalDescriptions.cashIn}
          icon={phIcon(ArrowDown, { size: ICON_SIZE.lg, weight: 'bold' })}
          tone="in"
        />
      }
      className="cash-form-modal cash-operation-form-modal cash-in-form-modal"
      wrapClassName="cash-form-modal-wrap"
      width={720}
      centered
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
          className="cash-modal-error"
          type="error"
          showIcon
          message={error}
        />
      ) : null}
      {resolvedAccount ? (
        <CashModalPreview title={resolvedAccount.name} tone="in">
          <CashPreviewItem
            label={CASH_LABELS.preview.balanceBefore}
            value={formatMoney(resolvedAccount.currentBalance)}
          />
          {balanceAfter !== null ? (
            <CashPreviewItem
              label={CASH_LABELS.preview.balanceAfter}
              value={formatMoney(balanceAfter)}
              emphasis
            />
          ) : null}
          {selectedPartner ? (
            <CashPreviewItem
              label={CASH_LABELS.preview.partnerDebtBefore}
              value={formatMoney(selectedPartner.currentDebtBalance)}
            />
          ) : null}
          {partnerDebtAfter !== null ? (
            <CashPreviewItem
              label={CASH_LABELS.preview.partnerDebtAfter}
              value={formatMoney(partnerDebtAfter)}
              emphasis
            />
          ) : null}
        </CashModalPreview>
      ) : null}
      <Form
        className="cash-modal-form"
        layout="vertical"
        requiredMark={cashRequiredMark}
      >
        <div className="cash-form-grid">
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
            className="cash-form-field-wide"
            label={CASH_LABELS.fields.sale}
            validateStatus={errors.saleId ? 'error' : undefined}
            help={
              errors.saleId?.message ?? CASH_LABELS.fields.relatedDocumentHint
            }
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
                      root: {
                        minWidth: 'min(360px, 92vw)',
                        maxWidth: 'min(560px, 92vw)',
                      },
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
                <ResponsiveDatePicker
                  style={{ width: '100%' }}
                  format={DATE_DISPLAY_FORMAT}
                  allowClear={false}
                  value={dateOnlyPickerValue(field.value)}
                  onChange={(d) => field.onChange(dateOnlyPickerToApi(d))}
                />
              )}
            />
          </Form.Item>
          <Form.Item
            className="cash-form-field-wide"
            label={CASH_LABELS.fields.notes}
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
        </div>
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
  const responsibleAccountId = useResponsibleDefaultAccountId(
    accounts.data?.data,
  );

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
    accounts.data?.data.find((row) => row.id === cashAccountId) ?? account;
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
      cashAccountId: responsibleAccountId || account?.id || '',
      partnerId: '',
      amount: '',
      transactionDate: bakuTodayDateOnly(),
      purchaseId: '',
      notes: '',
      negativeBalanceOverrideReason: '',
      balanceBefore:
        accounts.data?.data.find((row) => row.id === responsibleAccountId)
          ?.currentBalance ?? account?.currentBalance ?? '',
    });
  }, [open, account, responsibleAccountId, accounts.data?.data, reset]);

  useEffect(() => {
    if (!resolvedAccount) return;
    setValue('balanceBefore', resolvedAccount.currentBalance);
  }, [resolvedAccount, setValue]);

  function submitWithConfirm(values: CashOutFormValues) {
    const willGoNegative = needsNegativeReason;
    Modal.confirm({
      className: `cash-confirm-modal cash-confirm-modal-out${
        willGoNegative ? ' cash-confirm-modal-warning' : ''
      }`,
      centered: true,
      width: 440,
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
      title={
        <CashModalTitle
          title={CASH_LABELS.cashOut}
          description={CASH_LABELS.modalDescriptions.cashOut}
          icon={phIcon(ArrowUp, { size: ICON_SIZE.lg, weight: 'bold' })}
          tone="out"
        />
      }
      className="cash-form-modal cash-operation-form-modal cash-out-form-modal"
      wrapClassName="cash-form-modal-wrap"
      width={720}
      centered
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(submitWithConfirm)}
      confirmLoading={submitting}
      destroyOnHidden
      okText={CASH_LABELS.confirm}
      cancelText={CASH_LABELS.cancel}
      okButtonProps={needsNegativeReason ? { danger: true } : undefined}
      maskClosable={!submitting}
    >
      {error ? (
        <Alert
          className="cash-modal-error"
          type="error"
          showIcon
          message={error}
        />
      ) : null}
      {resolvedAccount ? (
        <CashModalPreview
          title={resolvedAccount.name}
          tone="out"
          warning={needsNegativeReason}
          notice={
            needsNegativeReason ? (
              <Alert
                className="cash-modal-preview-alert"
                type="warning"
                showIcon
                message={CASH_LABELS.preview.negativeWarning}
              />
            ) : undefined
          }
        >
          <CashPreviewItem
            label={CASH_LABELS.preview.balanceBefore}
            value={formatMoney(resolvedAccount.currentBalance)}
          />
          {balanceAfter !== null ? (
            <CashPreviewItem
              label={CASH_LABELS.preview.balanceAfter}
              value={formatMoney(balanceAfter)}
              emphasis
              danger={balanceAfter < 0}
            />
          ) : null}
          {selectedPartner ? (
            <CashPreviewItem
              label={CASH_LABELS.preview.partnerDebtBefore}
              value={formatMoney(selectedPartner.currentDebtBalance)}
            />
          ) : null}
          {partnerDebtAfter !== null ? (
            <CashPreviewItem
              label={CASH_LABELS.preview.partnerDebtAfter}
              value={formatMoney(partnerDebtAfter)}
              emphasis
            />
          ) : null}
        </CashModalPreview>
      ) : null}
      <Form
        className="cash-modal-form"
        layout="vertical"
        requiredMark={cashRequiredMark}
      >
        <div className="cash-form-grid">
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
            className="cash-form-field-wide"
            label={CASH_LABELS.fields.purchase}
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
                      root: {
                        minWidth: 'min(360px, 92vw)',
                        maxWidth: 'min(560px, 92vw)',
                      },
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
                <ResponsiveDatePicker
                  style={{ width: '100%' }}
                  format={DATE_DISPLAY_FORMAT}
                  allowClear={false}
                  value={dateOnlyPickerValue(field.value)}
                  onChange={(d) => field.onChange(dateOnlyPickerToApi(d))}
                />
              )}
            />
          </Form.Item>
          {needsNegativeReason ? (
            <Form.Item
              className="cash-form-field-wide"
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
            className="cash-form-field-wide"
            label={CASH_LABELS.fields.notes}
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
        </div>
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
  const responsibleAccountId = useResponsibleDefaultAccountId(
    accounts.data?.data,
  );

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
    accounts.data?.data.find((row) => row.id === cashAccountId) ?? account;
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
      cashAccountId: responsibleAccountId || account?.id || '',
      expenseCategoryId: '',
      amount: '',
      transactionDate: bakuTodayDateOnly(),
      notes: '',
      negativeBalanceOverrideReason: '',
      balanceBefore:
        accounts.data?.data.find((row) => row.id === responsibleAccountId)
          ?.currentBalance ?? account?.currentBalance ?? '',
    });
  }, [open, account, responsibleAccountId, accounts.data?.data, reset]);

  useEffect(() => {
    if (!resolvedAccount) return;
    setValue('balanceBefore', resolvedAccount.currentBalance);
  }, [resolvedAccount, setValue]);

  function submitWithConfirm(values: ExpenseFormValues) {
    Modal.confirm({
      className: `cash-confirm-modal cash-confirm-modal-expense${
        needsNegativeReason ? ' cash-confirm-modal-warning' : ''
      }`,
      centered: true,
      width: 440,
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
      title={
        <CashModalTitle
          title={CASH_LABELS.expense}
          description={CASH_LABELS.modalDescriptions.expense}
          icon={phIcon(Receipt, { size: ICON_SIZE.lg, weight: 'duotone' })}
          tone="expense"
        />
      }
      className="cash-form-modal cash-operation-form-modal cash-expense-form-modal"
      wrapClassName="cash-form-modal-wrap"
      width={720}
      centered
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(submitWithConfirm)}
      confirmLoading={submitting}
      destroyOnHidden
      okText={CASH_LABELS.confirm}
      cancelText={CASH_LABELS.cancel}
      okButtonProps={needsNegativeReason ? { danger: true } : undefined}
      maskClosable={!submitting}
    >
      {error ? (
        <Alert
          className="cash-modal-error"
          type="error"
          showIcon
          message={error}
        />
      ) : null}
      {resolvedAccount ? (
        <CashModalPreview
          title={resolvedAccount.name}
          tone="expense"
          warning={needsNegativeReason}
          notice={
            needsNegativeReason ? (
              <Alert
                className="cash-modal-preview-alert"
                type="warning"
                showIcon
                message={CASH_LABELS.preview.negativeWarning}
              />
            ) : undefined
          }
        >
          <CashPreviewItem
            label={CASH_LABELS.preview.balanceBefore}
            value={formatMoney(resolvedAccount.currentBalance)}
          />
          {balanceAfter !== null ? (
            <CashPreviewItem
              label={CASH_LABELS.preview.balanceAfter}
              value={formatMoney(balanceAfter)}
              emphasis
              danger={balanceAfter < 0}
            />
          ) : null}
        </CashModalPreview>
      ) : null}
      <Form
        className="cash-modal-form"
        layout="vertical"
        requiredMark={cashRequiredMark}
      >
        <div className="cash-form-grid">
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
                <ResponsiveDatePicker
                  style={{ width: '100%' }}
                  format={DATE_DISPLAY_FORMAT}
                  allowClear={false}
                  value={dateOnlyPickerValue(field.value)}
                  onChange={(d) => field.onChange(dateOnlyPickerToApi(d))}
                />
              )}
            />
          </Form.Item>
          {needsNegativeReason ? (
            <Form.Item
              className="cash-form-field-wide"
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
            className="cash-form-field-wide"
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
        </div>
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
  const responsibleAccountId = useResponsibleDefaultAccountId(
    accounts.data?.data,
  );

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
      sourceCashAccountId: responsibleAccountId || sourceAccount?.id || '',
      destinationCashAccountId: '',
      amount: '',
      transactionDate: bakuTodayDateOnly(),
      notes: '',
      negativeBalanceOverrideReason: '',
      balanceBefore:
        accounts.data?.data.find((row) => row.id === responsibleAccountId)
          ?.currentBalance ?? sourceAccount?.currentBalance ?? '',
    });
  }, [open, sourceAccount, responsibleAccountId, accounts.data?.data, reset]);

  useEffect(() => {
    if (!source) return;
    setValue('balanceBefore', source.currentBalance);
  }, [source, setValue]);

  function submitWithConfirm(values: TransferFormValues) {
    Modal.confirm({
      className: `cash-confirm-modal cash-confirm-modal-transfer${
        needsNegativeReason ? ' cash-confirm-modal-warning' : ''
      }`,
      centered: true,
      width: 440,
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
      title={
        <CashModalTitle
          title={CASH_LABELS.transfer}
          description={CASH_LABELS.modalDescriptions.transfer}
          icon={phIcon(ArrowsLeftRight, {
            size: ICON_SIZE.lg,
            weight: 'bold',
          })}
          tone="transfer"
        />
      }
      className="cash-form-modal cash-operation-form-modal cash-transfer-form-modal"
      wrapClassName="cash-form-modal-wrap"
      width={720}
      centered
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit(submitWithConfirm)}
      confirmLoading={submitting}
      destroyOnHidden
      okText={CASH_LABELS.confirm}
      cancelText={CASH_LABELS.cancel}
      okButtonProps={needsNegativeReason ? { danger: true } : undefined}
      maskClosable={!submitting}
    >
      {error ? (
        <Alert
          className="cash-modal-error"
          type="error"
          showIcon
          message={error}
        />
      ) : null}
      {source ? (
        <CashModalPreview
          title={CASH_LABELS.preview.totalCompanyCashUnchanged}
          tone="transfer"
          warning={needsNegativeReason}
          notice={
            needsNegativeReason ? (
              <Alert
                className="cash-modal-preview-alert"
                type="warning"
                showIcon
                message={CASH_LABELS.preview.transferNegativeWarning}
              />
            ) : undefined
          }
        >
          <CashPreviewItem
            label={CASH_LABELS.preview.sourceBalanceBefore}
            value={formatMoney(source.currentBalance)}
          />
          {sourceBalanceAfter !== null ? (
            <CashPreviewItem
              label={CASH_LABELS.preview.sourceBalanceAfter}
              value={formatMoney(sourceBalanceAfter)}
              emphasis
              danger={sourceBalanceAfter < 0}
            />
          ) : null}
          {destination ? (
            <CashPreviewItem
              label={CASH_LABELS.preview.destinationBalanceBefore}
              value={formatMoney(destination.currentBalance)}
            />
          ) : null}
          {destinationBalanceAfter !== null ? (
            <CashPreviewItem
              label={CASH_LABELS.preview.destinationBalanceAfter}
              value={formatMoney(destinationBalanceAfter)}
              emphasis
            />
          ) : null}
        </CashModalPreview>
      ) : null}
      <Form
        className="cash-modal-form"
        layout="vertical"
        requiredMark={cashRequiredMark}
      >
        <div className="cash-form-grid">
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
                <ResponsiveDatePicker
                  style={{ width: '100%' }}
                  format={DATE_DISPLAY_FORMAT}
                  allowClear={false}
                  value={dateOnlyPickerValue(field.value)}
                  onChange={(d) => field.onChange(dateOnlyPickerToApi(d))}
                />
              )}
            />
          </Form.Item>
          {needsNegativeReason ? (
            <Form.Item
              className="cash-form-field-wide"
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
            className="cash-form-field-wide"
            label={CASH_LABELS.fields.notes}
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
        </div>
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
        <CashModalTitle
          title={
            mode === 'create'
              ? CASH_LABELS.createExpenseCategory
              : CASH_LABELS.editExpenseCategory
          }
          description={
            mode === 'create'
              ? CASH_LABELS.modalDescriptions.categoryCreate
              : CASH_LABELS.modalDescriptions.categoryEdit
          }
          icon={phIcon(TagIcon, { size: ICON_SIZE.lg, weight: 'duotone' })}
          tone="expense"
        />
      }
      className="cash-form-modal cash-category-form-modal"
      wrapClassName="cash-form-modal-wrap"
      width={540}
      centered
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
          className="cash-modal-error"
          type="error"
          showIcon
          message={error}
        />
      ) : null}
      <Form
        className="cash-modal-form"
        layout="vertical"
        requiredMark={cashRequiredMark}
      >
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
