import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import type { MenuProps } from "antd";
import {
  ArrowDown,
  ArrowUp,
  ArrowsLeftRight,
  CaretRight,
  ClockCounterClockwise,
  DotsThree,
  PencilSimple,
  Plus,
  Power,
  Prohibit,
  Receipt,
  UserCircle,
  Wallet,
} from "@phosphor-icons/react";
import { mapApiError } from "../../../api/map-api-error";
import { useAuth } from "../../auth/use-auth";
import { formatDateTime } from "../../../shared/datetime";
import { formatMoney } from "../../../shared/money/format-money";
import { ICON_SIZE, phIcon } from "../../../shared/ui/ph-icon";
import { CodeText } from "../../../shared/ui/table-cells";
import { ActiveStatusTag } from "../../master-data/ui/active-status-tag";
import type { CashAccount } from "../api/cash.api";
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
import "./cash-accounts-page.css";

const { Text, Title } = Typography;

type AccountFormMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; account: CashAccount };

type MovementMode =
  | { kind: "closed" }
  | { kind: "in"; account: CashAccount | null }
  | { kind: "out"; account: CashAccount | null }
  | { kind: "expense"; account: CashAccount | null }
  | { kind: "transfer"; account: CashAccount | null };

function isNegativeBalance(value: string): boolean {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n < 0;
}

export function CashAccountsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isSuperAdmin = Boolean(user?.isSuperAdmin);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [formMode, setFormMode] = useState<AccountFormMode>({ kind: "closed" });
  const [movementMode, setMovementMode] = useState<MovementMode>(() => {
    const action = searchParams.get("action");
    if (action === "cash-in") return { kind: "in", account: null };
    if (action === "cash-out") return { kind: "out", account: null };
    if (action === "expense") return { kind: "expense", account: null };
    if (action === "transfer") return { kind: "transfer", account: null };
    return { kind: "closed" };
  });
  const [formError, setFormError] = useState<string | undefined>();
  const [movementError, setMovementError] = useState<string | undefined>();

  const listQuery = useMemo(
    () => ({
      page,
      pageSize,
      sortBy: "name" as const,
      sortOrder: "asc" as const,
    }),
    [page, pageSize],
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
      if (formMode.kind === "create") {
        await createMutation.mutateAsync({
          name: values.name,
          notes: values.notes || undefined,
          openingBalance: values.openingBalance || undefined,
          responsibleUserId: values.responsibleUserId,
        });
        message.success(CASH_LABELS.success.created);
      } else if (formMode.kind === "edit") {
        await updateMutation.mutateAsync({
          id: formMode.account.id,
          input: {
            name: values.name,
            notes: values.notes || null,
            ...(isSuperAdmin
              ? { responsibleUserId: values.responsibleUserId }
              : {}),
          },
        });
        message.success(CASH_LABELS.success.updated);
      }
      setFormMode({ kind: "closed" });
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

  function confirmDeactivate(account: CashAccount) {
    let reason = "";
    Modal.confirm({
      className: "cash-confirm-modal cash-account-state-confirm",
      centered: true,
      width: 460,
      title: CASH_LABELS.confirmations.deactivateTitle,
      content: (
        <Space
          className="cash-confirm-content"
          direction="vertical"
          style={{ width: "100%" }}
          size={12}
        >
          <Text>{CASH_LABELS.confirmations.deactivate}</Text>
          <Input.TextArea
            className="cash-confirm-reason"
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
      className: "cash-confirm-modal cash-account-state-confirm",
      centered: true,
      width: 440,
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

  function accountMenuItems(record: CashAccount): MenuProps["items"] {
    return [
      {
        key: "edit",
        icon: phIcon(PencilSimple, { size: ICON_SIZE.sm }),
        label: CASH_LABELS.editAccount,
        onClick: () => setFormMode({ kind: "edit", account: record }),
      },
      { type: "divider" },
      record.isActive
        ? {
            key: "deactivate",
            icon: phIcon(Prohibit, { size: ICON_SIZE.sm }),
            label: CASH_LABELS.deactivate,
            danger: true,
            onClick: () => confirmDeactivate(record),
          }
        : {
            key: "reactivate",
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
      <main className="cash-workspace">
        <header className="cash-page-header">
          <div className="cash-page-heading">
            <span className="cash-page-heading-icon" aria-hidden="true">
              {phIcon(Wallet, { size: ICON_SIZE.xl, weight: "duotone" })}
            </span>
            <div>
              <Title level={2} className="cash-page-title">
                {CASH_LABELS.title}
              </Title>
            </div>
          </div>
          {isSuperAdmin ? (
            <Button
              className="cash-create-button"
              icon={phIcon(Plus, { size: ICON_SIZE.md, weight: "bold" })}
              onClick={() => setFormMode({ kind: "create" })}
            >
              {CASH_LABELS.createAccount}
            </Button>
          ) : null}
        </header>

        <Card className="cash-hero-card">
          <div className="cash-hero-layout">
            <section className="cash-total-panel">
              <Text className="cash-hero-eyebrow">
                {CASH_LABELS.totalCompanyCash}
              </Text>
              <div className="cash-total-value" aria-live="polite">
                {totalCash.isLoading ? (
                  <Skeleton.Input active size="large" />
                ) : totalCash.data ? (
                  formatMoney(totalCash.data.totalCompanyCash)
                ) : (
                  "—"
                )}
              </div>
              <div className="cash-hero-meta">
                <span className="cash-account-count">
                  {totalCash.isLoading
                    ? "—"
                    : `${totalCash.data?.activeAccountCount ?? "—"} ${CASH_LABELS.activeAccountSuffix}`}
                </span>
                <Text className="cash-hero-caption">
                  {CASH_LABELS.companyCashHint}
                </Text>
              </div>
            </section>

            <section aria-labelledby="cash-primary-actions-title">
              <Text
                id="cash-primary-actions-title"
                className="cash-hero-eyebrow"
              >
                {CASH_LABELS.primaryActions}
              </Text>
              <div className="cash-primary-actions">
                <Button
                  className="cash-primary-action"
                  onClick={() => setMovementMode({ kind: "in", account: null })}
                >
                  <span className="cash-action-icon" aria-hidden="true">
                    {phIcon(ArrowDown, { size: ICON_SIZE.lg, weight: "bold" })}
                  </span>
                  <span className="cash-action-copy">
                    <span className="cash-action-label">
                      {CASH_LABELS.cashIn}
                    </span>
                    <span className="cash-action-hint">
                      {CASH_LABELS.actionHints.cashIn}
                    </span>
                  </span>
                </Button>
                <Button
                  className="cash-primary-action"
                  onClick={() =>
                    setMovementMode({ kind: "out", account: null })
                  }
                >
                  <span className="cash-action-icon" aria-hidden="true">
                    {phIcon(ArrowUp, { size: ICON_SIZE.lg, weight: "bold" })}
                  </span>
                  <span className="cash-action-copy">
                    <span className="cash-action-label">
                      {CASH_LABELS.cashOut}
                    </span>
                    <span className="cash-action-hint">
                      {CASH_LABELS.actionHints.cashOut}
                    </span>
                  </span>
                </Button>
                <Button
                  className="cash-primary-action"
                  onClick={() =>
                    setMovementMode({ kind: "expense", account: null })
                  }
                >
                  <span className="cash-action-icon" aria-hidden="true">
                    {phIcon(Receipt, { size: ICON_SIZE.lg, weight: "bold" })}
                  </span>
                  <span className="cash-action-copy">
                    <span className="cash-action-label">
                      {CASH_LABELS.expense}
                    </span>
                    <span className="cash-action-hint">
                      {CASH_LABELS.actionHints.expense}
                    </span>
                  </span>
                </Button>
                <Button
                  className="cash-primary-action"
                  onClick={() =>
                    setMovementMode({ kind: "transfer", account: null })
                  }
                >
                  <span className="cash-action-icon" aria-hidden="true">
                    {phIcon(ArrowsLeftRight, {
                      size: ICON_SIZE.lg,
                      weight: "bold",
                    })}
                  </span>
                  <span className="cash-action-copy">
                    <span className="cash-action-label">
                      {CASH_LABELS.transfer}
                    </span>
                    <span className="cash-action-hint">
                      {CASH_LABELS.actionHints.transfer}
                    </span>
                  </span>
                </Button>
              </div>
            </section>
          </div>
        </Card>

        {totalCash.isError ? (
          <Alert
            className="cash-summary-alert"
            type="warning"
            showIcon
            message={mapApiError(totalCash.error).userMessage}
            action={
              <Button size="small" onClick={() => void totalCash.refetch()}>
                {CASH_LABELS.retry}
              </Button>
            }
          />
        ) : null}
        {workspace.isError ? (
          <Alert
            className="cash-summary-alert"
            type="warning"
            showIcon
            message={CASH_LABELS.workspaceLoadError}
            action={
              <Button size="small" onClick={() => void workspace.refetch()}>
                {CASH_LABELS.retry}
              </Button>
            }
          />
        ) : null}

        <section aria-labelledby="cash-accounts-title">
          {list.isError ? (
            <Alert
              className="cash-list-alert"
              type="error"
              showIcon
              message={mapApiError(list.error).userMessage}
              action={
                <Button size="small" onClick={() => void list.refetch()}>
                  {CASH_LABELS.retry}
                </Button>
              }
            />
          ) : null}

          {list.isLoading ? (
            <Row gutter={[16, 16]} className="cash-loading-grid">
              {[0, 1, 2].map((item) => (
                <Col key={item} xs={24} lg={12} xxl={8}>
                  <Card className="cash-loading-card">
                    <Skeleton active paragraph={{ rows: 6 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          ) : null}

          {!list.isLoading && rows.length === 0 ? (
            <Card className="cash-empty-card">
              <Empty
                description={
                  <Space direction="vertical" size={4}>
                    <Text>{CASH_LABELS.empty}</Text>
                    <Text type="secondary">{CASH_LABELS.emptyHint}</Text>
                  </Space>
                }
              >
                {isSuperAdmin ? (
                  <Button
                    type="primary"
                    icon={phIcon(Plus, { size: ICON_SIZE.sm })}
                    onClick={() => setFormMode({ kind: "create" })}
                  >
                    {CASH_LABELS.createAccount}
                  </Button>
                ) : null}
              </Empty>
            </Card>
          ) : null}

          <Row gutter={[16, 16]}>
            {rows.map((account) => {
              const overview = todayByAccountId.get(account.id);
              const negative = isNegativeBalance(account.currentBalance);
              const summaryUnavailable = workspace.isError || !overview;

              return (
                <Col key={account.id} xs={24} lg={12} xxl={8}>
                  <Card
                    className={[
                      "cash-account-card",
                      negative ? "cash-account-card-negative" : "",
                      !account.isActive ? "cash-account-card-inactive" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="cash-account-topline">
                      <div className="cash-account-heading">
                        <Link to={`/cash/accounts/${account.id}`}>
                          <Text strong className="cash-account-name" ellipsis>
                            {account.name}
                          </Text>
                        </Link>{" "}
                        <div className="cash-account-tags">
                          <ActiveStatusTag isActive={account.isActive} />
                          {negative ? (
                            <Tag color="error">
                              {CASH_LABELS.negativeBalance}
                            </Tag>
                          ) : null}
                        </div>
                      </div>
                      <Dropdown
                        menu={{ items: accountMenuItems(account) }}
                        trigger={["click"]}
                      >
                        <Button
                          className="cash-account-menu"
                          type="text"
                          icon={phIcon(DotsThree, { size: ICON_SIZE.lg })}
                          aria-label={`${account.name}: ${CASH_LABELS.columns.actions}`}
                        />
                      </Dropdown>
                    </div>

                    <div className="cash-account-identity">
                      <CodeText value={account.code} />
                      <Text type="secondary" className="cash-responsible">
                        {phIcon(UserCircle, { size: ICON_SIZE.sm })}
                        <span>
                          {CASH_LABELS.columns.responsible}:{" "}
                          {account.responsibleUserName || "—"}
                        </span>
                      </Text>
                    </div>

                    <div className="cash-balance-panel">
                      <Text type="secondary" className="cash-balance-label">
                        {CASH_LABELS.currentBalanceLabel}
                      </Text>
                      <div className="cash-balance-value">
                        {formatMoney(account.currentBalance)}
                      </div>
                    </div>

                    <Text type="secondary" className="cash-today-label">
                      {CASH_LABELS.todaySummary}
                    </Text>
                    <div className="cash-daily-grid">
                      <div className="cash-daily-item cash-daily-item-in">
                        <div className="cash-daily-title">
                          {phIcon(ArrowDown, { size: 12, weight: "bold" })}
                          <span>{CASH_LABELS.todayCashInShort}</span>
                        </div>
                        <div className="cash-daily-value">
                          {workspace.isLoading ? (
                            <Skeleton.Input active size="small" block />
                          ) : summaryUnavailable ? (
                            "—"
                          ) : (
                            formatMoney(overview.todayCashIn)
                          )}
                        </div>
                      </div>
                      <div className="cash-daily-item cash-daily-item-out">
                        <div className="cash-daily-title">
                          {phIcon(ArrowUp, { size: 12, weight: "bold" })}
                          <span>{CASH_LABELS.todayCashOutShort}</span>
                        </div>
                        <div className="cash-daily-value">
                          {workspace.isLoading ? (
                            <Skeleton.Input active size="small" block />
                          ) : summaryUnavailable ? (
                            "—"
                          ) : (
                            formatMoney(overview.todayCashOut)
                          )}
                        </div>
                      </div>
                      <div className="cash-daily-item cash-daily-item-expense">
                        <div className="cash-daily-title">
                          {phIcon(Receipt, { size: 12, weight: "bold" })}
                          <span>{CASH_LABELS.todayExpensesShort}</span>
                        </div>
                        <div className="cash-daily-value">
                          {workspace.isLoading ? (
                            <Skeleton.Input active size="small" block />
                          ) : summaryUnavailable ? (
                            "—"
                          ) : (
                            formatMoney(overview.todayExpenses)
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="cash-activity">
                      <div className="cash-activity-heading">
                        {phIcon(ClockCounterClockwise, {
                          size: ICON_SIZE.sm,
                        })}
                        <Text strong>{CASH_LABELS.recentActivity}</Text>
                      </div>
                      {workspace.isLoading ? (
                        <Skeleton
                          active
                          title={false}
                          paragraph={{ rows: 2 }}
                        />
                      ) : summaryUnavailable ? (
                        <Text type="secondary" className="cash-activity-empty">
                          {CASH_LABELS.workspaceUnavailable}
                        </Text>
                      ) : overview.recentActivity.length > 0 ? (
                        <div className="cash-activity-list">
                          {overview.recentActivity.map((txn) => {
                            const isIncoming = txn.direction === "IN";
                            return (
                              <div key={txn.id} className="cash-activity-row">
                                <div className="cash-activity-main">
                                  <Text className="cash-activity-type">
                                    {CASH_LABELS.types[
                                      txn.type as keyof typeof CASH_LABELS.types
                                    ] ?? CASH_LABELS.unknownTransactionType}
                                  </Text>
                                  <Text
                                    type="secondary"
                                    className="cash-activity-meta"
                                  >
                                    {txn.transactionNumber} ·{" "}
                                    {formatDateTime(txn.transactionDate)}
                                  </Text>
                                </div>
                                <span
                                  className={`cash-activity-amount ${
                                    isIncoming
                                      ? "cash-activity-amount-in"
                                      : "cash-activity-amount-out"
                                  }`}
                                >
                                  {isIncoming ? "+" : "−"}
                                  {formatMoney(txn.amount)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <Text type="secondary" className="cash-activity-empty">
                          {CASH_LABELS.emptyTxns}
                        </Text>
                      )}
                    </div>

                    {!account.isActive ? (
                      <Alert
                        className="cash-inactive-note"
                        type="info"
                        showIcon
                        message={CASH_LABELS.inactiveAccountHint}
                      />
                    ) : null}

                    <div className="cash-account-footer">
                      <Button
                        className="cash-card-action cash-details-button"
                        block
                        onClick={() => navigate(`/cash/accounts/${account.id}`)}
                      >
                        <span>{CASH_LABELS.accountDetails}</span>
                        {phIcon(CaretRight, { size: ICON_SIZE.sm })}
                      </Button>
                      <Button
                        className="cash-card-action cash-card-action-in"
                        disabled={!account.isActive}
                        icon={phIcon(ArrowDown, { size: ICON_SIZE.sm })}
                        onClick={() => setMovementMode({ kind: "in", account })}
                      >
                        {CASH_LABELS.cashIn}
                      </Button>
                      <Button
                        className="cash-card-action cash-card-action-out"
                        disabled={!account.isActive}
                        icon={phIcon(ArrowUp, { size: ICON_SIZE.sm })}
                        onClick={() =>
                          setMovementMode({ kind: "out", account })
                        }
                      >
                        {CASH_LABELS.cashOut}
                      </Button>
                      <Button
                        className="cash-card-action cash-card-action-expense"
                        disabled={!account.isActive}
                        icon={phIcon(Receipt, { size: ICON_SIZE.sm })}
                        onClick={() =>
                          setMovementMode({ kind: "expense", account })
                        }
                      >
                        {CASH_LABELS.expense}
                      </Button>
                      <Button
                        className="cash-card-action cash-card-action-transfer"
                        disabled={!account.isActive}
                        icon={phIcon(ArrowsLeftRight, { size: ICON_SIZE.sm })}
                        onClick={() =>
                          setMovementMode({ kind: "transfer", account })
                        }
                      >
                        {CASH_LABELS.transfer}
                      </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {(list.data?.meta.total ?? 0) > 0 ? (
            <div className="cash-pagination">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={list.data?.meta.total ?? 0}
                showSizeChanger
                responsive
                showTotal={(total) =>
                  `${total} ${CASH_LABELS.accountCountSuffix}`
                }
                onChange={(nextPage, nextSize) => {
                  setPage(nextPage);
                  setPageSize(nextSize);
                }}
              />
            </div>
          ) : null}
        </section>
      </main>

      <CashAccountFormModal
        open={formMode.kind !== "closed"}
        mode={formMode.kind === "edit" ? "edit" : "create"}
        account={formMode.kind === "edit" ? formMode.account : null}
        submitting={submitting}
        error={formError}
        onCancel={() => {
          setFormMode({ kind: "closed" });
          setFormError(undefined);
        }}
        onSubmit={handleAccountSubmit}
      />

      <CashInFormModal
        open={movementMode.kind === "in"}
        account={movementMode.kind === "in" ? movementMode.account : null}
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
        account={movementMode.kind === "out" ? movementMode.account : null}
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
        account={movementMode.kind === "expense" ? movementMode.account : null}
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
        sourceAccount={
          movementMode.kind === "transfer" ? movementMode.account : null
        }
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
