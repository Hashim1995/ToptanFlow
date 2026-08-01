import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Grid,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowsLeftRight,
  PencilSimple,
  Prohibit,
  Receipt,
} from "@phosphor-icons/react";
import { mapApiError } from "../../../api/map-api-error";
import { formatMoney } from "../../../shared/money/format-money";
import { formatDateTime } from "../../../shared/ui/format";
import { ICON_SIZE, phIcon } from "../../../shared/ui/ph-icon";
import { CodeText, MoneyCell } from "../../../shared/ui/table-cells";
import { ActiveStatusTag } from "../../master-data/ui/active-status-tag";
import { FilterBar, FilterField } from "../../master-data/ui/list-toolbar";
import { PageHeader } from "../../master-data/ui/page-header";
import type { CashAccount, CashTransaction } from "../api/cash.api";
import {
  useCancelCashTransaction,
  useCashAccount,
  useCashTransactionsList,
  useCreateCashIn,
  useCreateCashOut,
  useCreateExpense,
  useCreateCashTransfer,
  useUpdateCashAccount,
} from "../api/cash.hooks";
import type {
  CashAccountFormValues,
  CashInFormValues,
  CashOutFormValues,
  ExpenseFormValues,
  TransferFormValues,
} from "../forms/cash.schemas";
import {
  CashAccountFormModal,
  CashInFormModal,
  CashOutFormModal,
  ExpenseFormModal,
  TransferFormModal,
} from "../ui/cash-form-modals";
import { CASH_LABELS } from "../ui/labels";

const { Text, Title } = Typography;

type TxnStatusFilter = "all" | "POSTED" | "CANCELLED";

function typeLabel(type: string): string {
  return CASH_LABELS.types[type as keyof typeof CASH_LABELS.types] ?? "—";
}

function statusLabel(status: string): string {
  return CASH_LABELS.statuses[status as "POSTED" | "CANCELLED"] ?? "—";
}

function isNegativeBalance(value: string): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n < 0;
}

export function CashAccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<TxnStatusFilter>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();
  const [movementMode, setMovementMode] = useState<
    | { kind: "closed" }
    | { kind: "in" }
    | { kind: "out" }
    | { kind: "expense" }
    | { kind: "transfer" }
  >({ kind: "closed" });
  const [movementError, setMovementError] = useState<string | undefined>();

  const account = useCashAccount(id);
  const txQuery = useMemo(
    () => ({
      page,
      pageSize,
      cashAccountId: id,
      status: statusFilter === "all" ? undefined : statusFilter,
      sortBy: "transactionDate" as const,
      sortOrder: "desc" as const,
    }),
    [page, pageSize, id, statusFilter],
  );
  const transactions = useCashTransactionsList(txQuery);
  const cancelMutation = useCancelCashTransaction();
  const updateMutation = useUpdateCashAccount();
  const cashInMutation = useCreateCashIn();
  const cashOutMutation = useCreateCashOut();
  const expenseMutation = useCreateExpense();
  const transferMutation = useCreateCashTransfer();

  const data = account.data;

  function cancelEffectsForType(type: string): readonly string[] {
    if (type === "CUSTOMER_RECEIPT") {
      return CASH_LABELS.confirmations.cancelEffectsCashIn;
    }
    if (type === "SUPPLIER_PAYMENT") {
      return CASH_LABELS.confirmations.cancelEffectsCashOut;
    }
    if (type === "EXPENSE") {
      return CASH_LABELS.confirmations.cancelEffectsExpense;
    }
    if (type === "TRANSFER_OUT" || type === "TRANSFER_IN") {
      return CASH_LABELS.confirmations.cancelEffectsTransfer;
    }
    return CASH_LABELS.confirmations.cancelEffectsGeneric;
  }

  function confirmCancel(txn: CashTransaction) {
    let reason = "";
    const effects = cancelEffectsForType(txn.type);
    const isCashIn = txn.type === "CUSTOMER_RECEIPT";
    Modal.confirm({
      title: CASH_LABELS.confirmations.cancelTxnTitle,
      width: 520,
      content: (
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Text>{CASH_LABELS.confirmations.cancelTxn}</Text>
          <Text type="secondary">
            {txn.transactionNumber} · {typeLabel(txn.type)} ·{" "}
            {formatMoney(txn.amount)}
          </Text>
          {isCashIn ? (
            <Text type="warning">
              {CASH_LABELS.confirmations.cancelCashInMayGoNegative}
            </Text>
          ) : null}
          <div>
            <Text strong>{CASH_LABELS.confirmations.cancelEffectsTitle}</Text>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              {effects.map((effect) => (
                <li key={effect}>
                  <Text type="secondary">{effect}</Text>
                </li>
              ))}
            </ul>
          </div>
          <Input.TextArea
            rows={3}
            autoFocus
            maxLength={2000}
            placeholder={CASH_LABELS.fields.cancelReasonPlaceholder}
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </Space>
      ),
      okText: CASH_LABELS.cancelTxn,
      cancelText: CASH_LABELS.close,
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!reason.trim()) {
          message.error(CASH_LABELS.validation.reasonRequired);
          return Promise.reject(new Error("reason required"));
        }
        try {
          await cancelMutation.mutateAsync({
            id: txn.id,
            reason: reason.trim(),
          });
          message.success(CASH_LABELS.success.cancelled);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          return Promise.reject(error);
        }
      },
    });
  }

  async function handleEdit(values: CashAccountFormValues) {
    if (!data) return;
    setFormError(undefined);
    try {
      await updateMutation.mutateAsync({
        id: data.id,
        input: {
          name: values.name,
          notes: values.notes || null,
        },
      });
      message.success(CASH_LABELS.success.updated);
      setEditOpen(false);
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
      setMovementMode({ kind: "closed" });
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
      setMovementMode({ kind: "closed" });
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
      setMovementMode({ kind: "closed" });
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
      setMovementMode({ kind: "closed" });
    } catch (error) {
      setMovementError(mapApiError(error).userMessage);
    }
  }

  const columns: ColumnsType<CashTransaction> = [
    {
      title: CASH_LABELS.columns.date,
      dataIndex: "transactionDate",
      key: "transactionDate",
      width: 120,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: CASH_LABELS.columns.number,
      dataIndex: "transactionNumber",
      key: "transactionNumber",
      width: 140,
      render: (value: string) => <CodeText value={value} />,
    },
    {
      title: CASH_LABELS.columns.type,
      dataIndex: "type",
      key: "type",
      render: (type: string) => typeLabel(type),
    },
    {
      title: CASH_LABELS.columns.partner,
      dataIndex: "partnerName",
      key: "partnerName",
      width: 180,
      render: (value: string | null) => value || "—",
    },
    {
      title: CASH_LABELS.columns.status,
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => (
        <Tag color={status === "CANCELLED" ? "default" : "success"}>
          {statusLabel(status)}
        </Tag>
      ),
    },
    {
      title: CASH_LABELS.columns.cashIn,
      key: "in",
      align: "right",
      width: 120,
      render: (_: unknown, row) =>
        row.direction === "IN" ? (
          <MoneyCell value={row.amount} format={formatMoney} />
        ) : (
          "—"
        ),
    },
    {
      title: CASH_LABELS.columns.cashOut,
      key: "out",
      align: "right",
      width: 120,
      render: (_: unknown, row) =>
        row.direction === "OUT" ? (
          <MoneyCell value={row.amount} format={formatMoney} />
        ) : (
          "—"
        ),
    },
    {
      title: CASH_LABELS.columns.balanceAfter,
      dataIndex: "balanceAfter",
      key: "balanceAfter",
      align: "right",
      width: 130,
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: CASH_LABELS.columns.notes,
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (value: string | null) => value || "—",
    },
    {
      title: CASH_LABELS.columns.createdBy,
      dataIndex: "createdByName",
      key: "createdByName",
      width: 160,
      render: (value: string | null) => value || "—",
    },
    {
      title: CASH_LABELS.columns.actions,
      key: "actions",
      width: 110,
      fixed: "right",
      render: (_: unknown, row) =>
        row.status === "POSTED" && row.type !== "REVERSAL" ? (
          <Button
            type="link"
            danger
            size="small"
            icon={phIcon(Prohibit, { size: ICON_SIZE.sm })}
            onClick={() => confirmCancel(row)}
          >
            {CASH_LABELS.cancelTxn}
          </Button>
        ) : null,
    },
  ];

  if (account.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message={mapApiError(account.error).userMessage}
        action={
          <Space>
            <Button size="small" onClick={() => void account.refetch()}>
              {CASH_LABELS.retry}
            </Button>
            <Link to="/cash/accounts">
              <Button size="small">{CASH_LABELS.backToList}</Button>
            </Link>
          </Space>
        }
      />
    );
  }

  const txnRows = transactions.data?.data ?? [];

  return (
    <>
      <PageHeader
        title={data?.name ?? "…"}
        description={
          data ? (
            <Space wrap size={8}>
              <Text strong>{formatMoney(data.currentBalance)}</Text>
              {isNegativeBalance(data.currentBalance) ? (
                <Tag color="error">{CASH_LABELS.negativeBalance}</Tag>
              ) : null}
              <ActiveStatusTag isActive={data.isActive} />
            </Space>
          ) : undefined
        }
        icon={
          <Link to="/cash/accounts" aria-label={CASH_LABELS.backToList}>
            <Button
              type="text"
              icon={phIcon(ArrowLeft, { size: ICON_SIZE.md })}
            />
          </Link>
        }
        extra={
          data ? (
            <Space wrap>
              <Button
                icon={phIcon(PencilSimple, { size: ICON_SIZE.sm })}
                onClick={() => setEditOpen(true)}
              >
                {CASH_LABELS.editAccount}
              </Button>
              <Button
                type="primary"
                ghost
                disabled={!data.isActive}
                icon={phIcon(ArrowDown, { size: ICON_SIZE.sm })}
                onClick={() => setMovementMode({ kind: "in" })}
              >
                {CASH_LABELS.cashIn}
              </Button>
              <Button
                danger
                ghost
                disabled={!data.isActive}
                icon={phIcon(ArrowUp, { size: ICON_SIZE.sm })}
                onClick={() => setMovementMode({ kind: "out" })}
              >
                {CASH_LABELS.cashOut}
              </Button>
              <Button
                disabled={!data.isActive}
                icon={phIcon(Receipt, { size: ICON_SIZE.sm })}
                onClick={() => setMovementMode({ kind: "expense" })}
              >
                {CASH_LABELS.expense}
              </Button>
              <Button
                disabled={!data.isActive}
                icon={phIcon(ArrowsLeftRight, { size: ICON_SIZE.sm })}
                onClick={() => setMovementMode({ kind: "transfer" })}
              >
                {CASH_LABELS.transfer}
              </Button>
            </Space>
          ) : null
        }
      />

      {data && !data.isActive ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={CASH_LABELS.inactiveAccountHint}
        />
      ) : null}

      {data ? (
        <Card
          size="small"
          style={{ marginBottom: 16 }}
          loading={account.isLoading}
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
            <Descriptions.Item label={CASH_LABELS.columns.code}>
              <CodeText value={data.code} />
            </Descriptions.Item>
            <Descriptions.Item label={CASH_LABELS.columns.balance}>
              {formatMoney(data.currentBalance)}
            </Descriptions.Item>
            <Descriptions.Item label={CASH_LABELS.columns.responsible}>
              {data.responsibleUserName || "—"}
            </Descriptions.Item>
            <Descriptions.Item label={CASH_LABELS.fields.notes}>
              {data.notes || "—"}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ) : (
        <Card loading style={{ marginBottom: 16 }} />
      )}

      <Title level={5} style={{ marginTop: 0 }}>
        {CASH_LABELS.historyTitle}
      </Title>

      <FilterBar>
        <FilterField label={CASH_LABELS.filters.txnStatus}>
          <Select
            value={statusFilter}
            style={{ minWidth: 180 }}
            onChange={(value: TxnStatusFilter) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={[
              { value: "all", label: CASH_LABELS.filters.txnStatusAll },
              {
                value: "POSTED",
                label: CASH_LABELS.statuses.POSTED,
              },
              {
                value: "CANCELLED",
                label: CASH_LABELS.statuses.CANCELLED,
              },
            ]}
          />
        </FilterField>
      </FilterBar>

      {transactions.isError ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={mapApiError(transactions.error).userMessage}
          action={
            <Button size="small" onClick={() => void transactions.refetch()}>
              {CASH_LABELS.retry}
            </Button>
          }
        />
      ) : null}

      {isDesktop ? (
        <Table<CashTransaction>
          rowKey="id"
          loading={transactions.isLoading || account.isLoading}
          columns={columns}
          dataSource={txnRows}
          pagination={false}
          scroll={{ x: 1300 }}
          size="middle"
          locale={{ emptyText: CASH_LABELS.emptyTxns }}
        />
      ) : (
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          {transactions.isLoading ? <Card loading /> : null}
          {!transactions.isLoading && txnRows.length === 0 ? (
            <Empty description={CASH_LABELS.emptyTxns} />
          ) : null}
          {txnRows.map((row) => (
            <Card
              key={row.id}
              size="small"
              title={
                <Space wrap>
                  <CodeText value={row.transactionNumber} />
                  <Tag
                    color={row.status === "CANCELLED" ? "default" : "success"}
                  >
                    {statusLabel(row.status)}
                  </Tag>
                </Space>
              }
              extra={formatDateTime(row.transactionDate)}
            >
              <Space direction="vertical" size={6} style={{ width: "100%" }}>
                <Text>{typeLabel(row.type)}</Text>
                {row.partnerName ? (
                  <Text type="secondary">
                    {CASH_LABELS.columns.partner}: {row.partnerName}
                  </Text>
                ) : null}
                <Text>
                  {row.direction === "IN"
                    ? CASH_LABELS.cashIn
                    : CASH_LABELS.cashOut}
                  : <Text strong> {formatMoney(row.amount)}</Text>
                </Text>
                <Text type="secondary">
                  {CASH_LABELS.columns.balanceAfter}:{" "}
                  {formatMoney(row.balanceAfter)}
                </Text>
                {row.notes ? <Text type="secondary">{row.notes}</Text> : null}
                {row.status === "POSTED" && row.type !== "REVERSAL" ? (
                  <Button
                    danger
                    size="small"
                    icon={phIcon(Prohibit, { size: ICON_SIZE.sm })}
                    onClick={() => confirmCancel(row)}
                  >
                    {CASH_LABELS.cancelTxn}
                  </Button>
                ) : null}
              </Space>
            </Card>
          ))}
        </Space>
      )}

      <Pagination
        style={{ marginTop: 16, textAlign: "right" }}
        current={page}
        pageSize={pageSize}
        total={transactions.data?.meta.total ?? 0}
        showSizeChanger
        onChange={(nextPage, nextSize) => {
          setPage(nextPage);
          setPageSize(nextSize);
        }}
      />

      <CashAccountFormModal
        open={editOpen}
        mode="edit"
        account={data ?? null}
        submitting={updateMutation.isPending}
        error={formError}
        onCancel={() => {
          setEditOpen(false);
          setFormError(undefined);
        }}
        onSubmit={handleEdit}
      />

      <CashInFormModal
        open={movementMode.kind === "in"}
        account={(data as CashAccount | undefined) ?? null}
        submitting={cashInMutation.isPending}
        error={movementError}
        onCancel={() => {
          setMovementMode({ kind: "closed" });
          setMovementError(undefined);
        }}
        onSubmit={handleCashIn}
      />

      <CashOutFormModal
        open={movementMode.kind === "out"}
        account={(data as CashAccount | undefined) ?? null}
        submitting={cashOutMutation.isPending}
        error={movementError}
        onCancel={() => {
          setMovementMode({ kind: "closed" });
          setMovementError(undefined);
        }}
        onSubmit={handleCashOut}
      />

      <ExpenseFormModal
        open={movementMode.kind === "expense"}
        account={(data as CashAccount | undefined) ?? null}
        submitting={expenseMutation.isPending}
        error={movementError}
        onCancel={() => {
          setMovementMode({ kind: "closed" });
          setMovementError(undefined);
        }}
        onSubmit={handleExpense}
      />

      <TransferFormModal
        open={movementMode.kind === "transfer"}
        sourceAccount={(data as CashAccount | undefined) ?? null}
        submitting={transferMutation.isPending}
        error={movementError}
        onCancel={() => {
          setMovementMode({ kind: "closed" });
          setMovementError(undefined);
        }}
        onSubmit={handleTransfer}
      />
    </>
  );
}
