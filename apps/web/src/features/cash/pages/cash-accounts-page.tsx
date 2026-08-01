import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Input,
  Modal,
  Pagination,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  ArrowDown,
  ArrowUp,
  ArrowsLeftRight,
  DotsThree,
  PencilSimple,
  Plus,
  Power,
  Prohibit,
  Receipt,
  Wallet,
} from '@phosphor-icons/react';
import { mapApiError } from '../../../api/map-api-error';
import { formatMoney } from '../../../shared/money/format-money';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import { CodeText } from '../../../shared/ui/table-cells';
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from '../../master-data/ui/active-filter';
import { ActiveStatusTag } from '../../master-data/ui/active-status-tag';
import {
  ActiveStatusFilter,
  FilterBar,
  FilterField,
} from '../../master-data/ui/list-toolbar';
import { PageHeader } from '../../master-data/ui/page-header';
import type { CashAccount } from '../api/cash.api';
import {
  useCashAccountsList,
  useCreateCashAccount,
  useCreateCashIn,
  useCreateCashOut,
  useCreateExpense,
  useCreateCashTransfer,
  useDeactivateCashAccount,
  useReactivateCashAccount,
  useCashWorkspaceOverview,
  useTotalCompanyCash,
  useUpdateCashAccount,
} from '../api/cash.hooks';
import type {
  CashAccountFormValues,
  CashInFormValues,
  CashOutFormValues,
  ExpenseFormValues,
  TransferFormValues,
} from '../forms/cash.schemas';
import {
  CashAccountFormModal,
  CashInFormModal,
  CashOutFormModal,
  ExpenseFormModal,
  TransferFormModal,
} from '../ui/cash-form-modals';
import { CASH_LABELS } from '../ui/labels';

const { Text } = Typography;

type AccountFormMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; account: CashAccount };

type MovementMode =
  | { kind: 'closed' }
  | { kind: 'in'; account: CashAccount | null }
  | { kind: 'out'; account: CashAccount | null }
  | { kind: 'expense'; account: CashAccount | null }
  | { kind: 'transfer'; account: CashAccount | null };

function isNegativeBalance(value: string): boolean {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n < 0;
}

export function CashAccountsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [formMode, setFormMode] = useState<AccountFormMode>({ kind: 'closed' });
  const [movementMode, setMovementMode] = useState<MovementMode>({
    kind: 'closed',
  });
  const [formError, setFormError] = useState<string | undefined>();
  const [movementError, setMovementError] = useState<string | undefined>();

  const listQuery = useMemo(
    () => ({
      page,
      pageSize,
      search: search || undefined,
      isActive: activeFilterToIsActive(activeFilter),
      sortBy: 'name' as const,
      sortOrder: 'asc' as const,
    }),
    [page, pageSize, search, activeFilter],
  );

  const list = useCashAccountsList(listQuery);
  const totalCash = useTotalCompanyCash();
  const workspace = useCashWorkspaceOverview();
  const createMutation = useCreateCashAccount();
  const updateMutation = useUpdateCashAccount();
  const deactivateMutation = useDeactivateCashAccount();
  const reactivateMutation = useReactivateCashAccount();
  const cashInMutation = useCreateCashIn();
  const cashOutMutation = useCreateCashOut();
  const expenseMutation = useCreateExpense();
  const transferMutation = useCreateCashTransfer();

  const submitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    cashInMutation.isPending ||
    cashOutMutation.isPending ||
    expenseMutation.isPending ||
    transferMutation.isPending;

  async function handleAccountSubmit(values: CashAccountFormValues) {
    setFormError(undefined);
    try {
      if (formMode.kind === 'create') {
        await createMutation.mutateAsync({
          name: values.name,
          notes: values.notes || undefined,
          openingBalance: values.openingBalance || undefined,
        });
        message.success(CASH_LABELS.success.created);
      } else if (formMode.kind === 'edit') {
        await updateMutation.mutateAsync({
          id: formMode.account.id,
          input: {
            name: values.name,
            notes: values.notes || null,
          },
        });
        message.success(CASH_LABELS.success.updated);
      }
      setFormMode({ kind: 'closed' });
    } catch (error) {
      setFormError(mapApiError(error).userMessage);
    }
  }

  async function handleCashIn(values: CashInFormValues) {
    setMovementError(undefined);
    try {
      await cashInMutation.mutateAsync({
        cashAccountId: values.cashAccountId,
        partnerId: values.partnerId,
        amount: values.amount,
        transactionDate: values.transactionDate,
        saleId: values.saleId || undefined,
        notes: values.notes || undefined,
      });
      message.success(CASH_LABELS.success.cashIn);
      setMovementMode({ kind: 'closed' });
    } catch (error) {
      setMovementError(mapApiError(error).userMessage);
    }
  }

  async function handleCashOut(values: CashOutFormValues) {
    setMovementError(undefined);
    try {
      await cashOutMutation.mutateAsync({
        cashAccountId: values.cashAccountId,
        partnerId: values.partnerId,
        amount: values.amount,
        transactionDate: values.transactionDate,
        purchaseId: values.purchaseId || undefined,
        notes: values.notes || undefined,
        negativeBalanceOverrideReason:
          values.negativeBalanceOverrideReason || undefined,
      });
      message.success(CASH_LABELS.success.cashOut);
      setMovementMode({ kind: 'closed' });
    } catch (error) {
      setMovementError(mapApiError(error).userMessage);
    }
  }

  async function handleExpense(values: ExpenseFormValues) {
    setMovementError(undefined);
    try {
      await expenseMutation.mutateAsync({
        cashAccountId: values.cashAccountId,
        expenseCategoryId: values.expenseCategoryId,
        amount: values.amount,
        transactionDate: values.transactionDate,
        notes: values.notes,
        negativeBalanceOverrideReason:
          values.negativeBalanceOverrideReason || undefined,
      });
      message.success(CASH_LABELS.success.expense);
      setMovementMode({ kind: 'closed' });
    } catch (error) {
      setMovementError(mapApiError(error).userMessage);
    }
  }

  async function handleTransfer(values: TransferFormValues) {
    setMovementError(undefined);
    try {
      await transferMutation.mutateAsync({
        sourceCashAccountId: values.sourceCashAccountId,
        destinationCashAccountId: values.destinationCashAccountId,
        amount: values.amount,
        transactionDate: values.transactionDate,
        notes: values.notes || undefined,
        negativeBalanceOverrideReason:
          values.negativeBalanceOverrideReason || undefined,
      });
      message.success(CASH_LABELS.success.transfer);
      setMovementMode({ kind: 'closed' });
    } catch (error) {
      setMovementError(mapApiError(error).userMessage);
    }
  }

  function confirmDeactivate(account: CashAccount) {
    let reason = '';
    Modal.confirm({
      title: CASH_LABELS.confirmations.deactivateTitle,
      content: (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Text>{CASH_LABELS.confirmations.deactivate}</Text>
          <Input.TextArea
            rows={2}
            placeholder={CASH_LABELS.fields.deactivationReasonPlaceholder}
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </Space>
      ),
      okText: CASH_LABELS.deactivate,
      cancelText: CASH_LABELS.cancel,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateMutation.mutateAsync({
            id: account.id,
            reason: reason.trim() || undefined,
          });
          message.success(CASH_LABELS.success.deactivated);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  function confirmReactivate(account: CashAccount) {
    Modal.confirm({
      title: CASH_LABELS.confirmations.reactivateTitle,
      content: CASH_LABELS.confirmations.reactivate,
      okText: CASH_LABELS.reactivate,
      cancelText: CASH_LABELS.cancel,
      onOk: async () => {
        try {
          await reactivateMutation.mutateAsync(account.id);
          message.success(CASH_LABELS.success.reactivated);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  function accountMenuItems(record: CashAccount): MenuProps['items'] {
    return [
      {
        key: 'edit',
        icon: phIcon(PencilSimple, { size: ICON_SIZE.sm }),
        label: CASH_LABELS.editAccount,
        onClick: () => setFormMode({ kind: 'edit', account: record }),
      },
      { type: 'divider' },
      record.isActive
        ? {
            key: 'deactivate',
            icon: phIcon(Prohibit, { size: ICON_SIZE.sm }),
            label: CASH_LABELS.deactivate,
            danger: true,
            onClick: () => confirmDeactivate(record),
          }
        : {
            key: 'reactivate',
            icon: phIcon(Power, { size: ICON_SIZE.sm }),
            label: CASH_LABELS.reactivate,
            onClick: () => confirmReactivate(record),
          },
    ];
  }

  const rows = list.data?.data ?? [];
  const todayByAccountId = useMemo(() => {
    const map = new Map<
      string,
      {
        todayCashIn: string;
        todayCashOut: string;
        todayExpenses: string;
        recentActivity: Array<{
          id: string;
          transactionNumber: string;
          type: string;
          direction: string;
          amount: string;
          transactionDate: string;
        }>;
      }
    >();
    for (const account of workspace.data?.accounts ?? []) {
      map.set(account.id, {
        todayCashIn: account.todayCashIn,
        todayCashOut: account.todayCashOut,
        todayExpenses: account.todayExpenses,
        recentActivity: account.recentActivity,
      });
    }
    return map;
  }, [workspace.data?.accounts]);

  return (
    <>
      <PageHeader
        title={CASH_LABELS.title}
        description={CASH_LABELS.description}
        icon={phIcon(Wallet, { size: ICON_SIZE.lg })}
        extra={
          <Space wrap>
            <Button
              type="primary"
              icon={phIcon(ArrowDown, { size: ICON_SIZE.sm })}
              onClick={() => setMovementMode({ kind: 'in', account: null })}
            >
              {CASH_LABELS.cashIn}
            </Button>
            <Button
              danger
              icon={phIcon(ArrowUp, { size: ICON_SIZE.sm })}
              onClick={() => setMovementMode({ kind: 'out', account: null })}
            >
              {CASH_LABELS.cashOut}
            </Button>
            <Button
              icon={phIcon(Receipt, { size: ICON_SIZE.sm })}
              onClick={() => setMovementMode({ kind: 'expense', account: null })}
            >
              {CASH_LABELS.expense}
            </Button>
            <Button
              icon={phIcon(ArrowsLeftRight, { size: ICON_SIZE.sm })}
              onClick={() =>
                setMovementMode({ kind: 'transfer', account: null })
              }
            >
              {CASH_LABELS.transfer}
            </Button>
            <Button
              icon={phIcon(Plus, { size: ICON_SIZE.sm })}
              onClick={() => setFormMode({ kind: 'create' })}
            >
              {CASH_LABELS.createAccount}
            </Button>
          </Space>
        }
      />

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Statistic
              title={CASH_LABELS.totalCompanyCash}
              value={
                totalCash.data
                  ? formatMoney(totalCash.data.totalCompanyCash)
                  : '—'
              }
              loading={totalCash.isLoading}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Statistic
              title={CASH_LABELS.activeAccounts}
              value={totalCash.data?.activeAccountCount ?? '—'}
              loading={totalCash.isLoading}
            />
          </Col>
        </Row>
        {totalCash.isError ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginTop: 12 }}
            message={mapApiError(totalCash.error).userMessage}
            action={
              <Button size="small" onClick={() => void totalCash.refetch()}>
                {CASH_LABELS.retry}
              </Button>
            }
          />
        ) : null}
      </Card>

      <FilterBar>
        <FilterField label={CASH_LABELS.filters.search}>
          <Input.Search
            allowClear
            placeholder={CASH_LABELS.filters.searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={(value) => {
              setSearch(value.trim());
              setPage(1);
            }}
            style={{ minWidth: 220 }}
          />
        </FilterField>
        <ActiveStatusFilter
          value={activeFilter}
          onChange={(value) => {
            setActiveFilter(value);
            setPage(1);
          }}
        />
      </FilterBar>

      {list.isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={mapApiError(list.error).userMessage}
          action={
            <Button size="small" onClick={() => void list.refetch()}>
              {CASH_LABELS.retry}
            </Button>
          }
        />
      ) : null}

      {list.isLoading ? <Card loading /> : null}
      {!list.isLoading && rows.length === 0 ? (
        <Empty
          description={
            <Space direction="vertical" size={4}>
              <Text>{CASH_LABELS.empty}</Text>
              <Text type="secondary">{CASH_LABELS.emptyHint}</Text>
            </Space>
          }
        >
          <Button
            type="primary"
            icon={phIcon(Plus, { size: ICON_SIZE.sm })}
            onClick={() => setFormMode({ kind: 'create' })}
          >
            {CASH_LABELS.createAccount}
          </Button>
        </Empty>
      ) : null}
      <Row gutter={[16, 16]}>
        {rows.map((account) => (
          <Col key={account.id} xs={24} md={12} xl={8}>
            <Card
              size="small"
              title={
                <Space wrap>
                  <Link to={`/cash/accounts/${account.id}`}>
                    <Text strong>{account.name}</Text>
                  </Link>
                  <ActiveStatusTag isActive={account.isActive} />
                  {isNegativeBalance(account.currentBalance) ? (
                    <Tag color="error">{CASH_LABELS.negativeBalance}</Tag>
                  ) : null}
                </Space>
              }
              extra={
                <Dropdown
                  menu={{ items: accountMenuItems(account) }}
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    icon={phIcon(DotsThree, { size: ICON_SIZE.md })}
                    aria-label={CASH_LABELS.columns.actions}
                  />
                </Dropdown>
              }
            >
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <CodeText value={account.code} />
                <Text strong>{formatMoney(account.currentBalance)}</Text>
                <Text type="secondary">
                  {CASH_LABELS.columns.responsible}:{' '}
                  {account.responsibleUserName || '—'}
                </Text>
                <Row gutter={[8, 8]}>
                  <Col span={8}>
                    <Statistic
                      title={CASH_LABELS.todayCashIn}
                      value={formatMoney(
                        todayByAccountId.get(account.id)?.todayCashIn ?? '0.00',
                      )}
                      valueStyle={{ fontSize: 14 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title={CASH_LABELS.todayCashOut}
                      value={formatMoney(
                        todayByAccountId.get(account.id)?.todayCashOut ??
                          '0.00',
                      )}
                      valueStyle={{ fontSize: 14 }}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title={CASH_LABELS.todayExpenses}
                      value={formatMoney(
                        todayByAccountId.get(account.id)?.todayExpenses ??
                          '0.00',
                      )}
                      valueStyle={{ fontSize: 14 }}
                    />
                  </Col>
                </Row>
                {(todayByAccountId.get(account.id)?.recentActivity.length ??
                  0) > 0 ? (
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Text type="secondary">{CASH_LABELS.recentActivity}</Text>
                    {todayByAccountId
                      .get(account.id)
                      ?.recentActivity.map((txn) => (
                        <Text key={txn.id} style={{ fontSize: 12 }}>
                          {CASH_LABELS.types[
                            txn.type as keyof typeof CASH_LABELS.types
                          ] ?? txn.type}{' '}
                          · {formatMoney(txn.amount)}
                        </Text>
                      ))}
                  </Space>
                ) : null}
                {!account.isActive ? (
                  <Text type="secondary">{CASH_LABELS.inactiveAccountHint}</Text>
                ) : null}
                <Space wrap>
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    disabled={!account.isActive}
                    icon={phIcon(ArrowDown, { size: ICON_SIZE.sm })}
                    onClick={() =>
                      setMovementMode({ kind: 'in', account })
                    }
                  >
                    {CASH_LABELS.cashIn}
                  </Button>
                  <Button
                    size="small"
                    danger
                    ghost
                    disabled={!account.isActive}
                    icon={phIcon(ArrowUp, { size: ICON_SIZE.sm })}
                    onClick={() =>
                      setMovementMode({ kind: 'out', account })
                    }
                  >
                    {CASH_LABELS.cashOut}
                  </Button>
                  <Button
                    size="small"
                    disabled={!account.isActive}
                    icon={phIcon(Receipt, { size: ICON_SIZE.sm })}
                    onClick={() =>
                      setMovementMode({ kind: 'expense', account })
                    }
                  >
                    {CASH_LABELS.expense}
                  </Button>
                  <Button
                    size="small"
                    disabled={!account.isActive}
                    icon={phIcon(ArrowsLeftRight, { size: ICON_SIZE.sm })}
                    onClick={() =>
                      setMovementMode({ kind: 'transfer', account })
                    }
                  >
                    {CASH_LABELS.transfer}
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Pagination
        style={{ marginTop: 16, textAlign: 'right' }}
        current={page}
        pageSize={pageSize}
        total={list.data?.meta.total ?? 0}
        showSizeChanger
        showTotal={(total) => `${total}`}
        onChange={(nextPage, nextSize) => {
          setPage(nextPage);
          setPageSize(nextSize);
        }}
      />

      <CashAccountFormModal
        open={formMode.kind !== 'closed'}
        mode={formMode.kind === 'edit' ? 'edit' : 'create'}
        account={formMode.kind === 'edit' ? formMode.account : null}
        submitting={submitting}
        error={formError}
        onCancel={() => {
          setFormMode({ kind: 'closed' });
          setFormError(undefined);
        }}
        onSubmit={handleAccountSubmit}
      />

      <CashInFormModal
        open={movementMode.kind === 'in'}
        account={movementMode.kind === 'in' ? movementMode.account : null}
        submitting={cashInMutation.isPending}
        error={movementError}
        onCancel={() => {
          setMovementMode({ kind: 'closed' });
          setMovementError(undefined);
        }}
        onSubmit={handleCashIn}
      />

      <CashOutFormModal
        open={movementMode.kind === 'out'}
        account={movementMode.kind === 'out' ? movementMode.account : null}
        submitting={cashOutMutation.isPending}
        error={movementError}
        onCancel={() => {
          setMovementMode({ kind: 'closed' });
          setMovementError(undefined);
        }}
        onSubmit={handleCashOut}
      />

      <ExpenseFormModal
        open={movementMode.kind === 'expense'}
        account={
          movementMode.kind === 'expense' ? movementMode.account : null
        }
        submitting={expenseMutation.isPending}
        error={movementError}
        onCancel={() => {
          setMovementMode({ kind: 'closed' });
          setMovementError(undefined);
        }}
        onSubmit={handleExpense}
      />

      <TransferFormModal
        open={movementMode.kind === 'transfer'}
        sourceAccount={
          movementMode.kind === 'transfer' ? movementMode.account : null
        }
        submitting={transferMutation.isPending}
        error={movementError}
        onCancel={() => {
          setMovementMode({ kind: 'closed' });
          setMovementError(undefined);
        }}
        onSubmit={handleTransfer}
      />
    </>
  );
}
