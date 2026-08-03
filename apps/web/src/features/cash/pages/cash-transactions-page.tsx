import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Empty,
  Grid,
  Input,
  Pagination,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import {
  ArrowDown,
  ArrowUp,
  ArrowsDownUp,
  CalendarBlank,
  NoteBlank,
  User,
  Wallet,
} from "@phosphor-icons/react";
import { mapApiError } from "../../../api/map-api-error";
import {
  DATE_DISPLAY_FORMAT,
  dateOnlyPickerToApi,
} from "../../../shared/datetime";
import { formatMoney } from "../../../shared/money/format-money";
import { formatDateTime } from "../../../shared/ui/format";
import { ICON_SIZE, phIcon } from "../../../shared/ui/ph-icon";
import { CodeText, MoneyCell } from "../../../shared/ui/table-cells";
import { FilterBar, FilterField } from "../../master-data/ui/list-toolbar";
import { PageHeader } from "../../master-data/ui/page-header";
import type {
  CashTransaction,
  CashTransactionListQuery,
  CashTxnDirection,
  CashTxnStatus,
} from "../api/cash.api";
import {
  useCashAccountsList,
  useCashTransactionsList,
} from "../api/cash.hooks";
import { CASH_LABELS } from "../ui/labels";
import "./cash-transactions-page.css";

const { Text } = Typography;
const { RangePicker } = DatePicker;

type FilterDraft = {
  transactionNumber: string;
  cashAccountId?: string;
  type?: string;
  direction?: CashTxnDirection;
  status?: CashTxnStatus;
  dateRange: [Dayjs | null, Dayjs | null] | null;
};

const EMPTY_FILTERS: FilterDraft = {
  transactionNumber: "",
  dateRange: null,
};

function transactionTypeLabel(type: string): string {
  return CASH_LABELS.types[type as keyof typeof CASH_LABELS.types] ?? "—";
}

function transactionStatusLabel(status: string): string {
  return CASH_LABELS.statuses[status as "POSTED" | "CANCELLED"] ?? "—";
}

export function CashTransactionsPage() {
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [draft, setDraft] = useState<FilterDraft>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<CashTransactionListQuery>({});

  const accounts = useCashAccountsList({
    page: 1,
    pageSize: 100,
    sortBy: "name",
    sortOrder: "asc",
  });
  const query = useMemo<CashTransactionListQuery>(
    () => ({
      ...filters,
      page,
      pageSize,
      sortBy: "transactionDate",
      sortOrder: "desc",
    }),
    [filters, page, pageSize],
  );
  const transactions = useCashTransactionsList(query);
  const rows = transactions.data?.data ?? [];
  const total = transactions.data?.meta.total ?? 0;

  function applyFilters() {
    setFilters({
      transactionNumber: draft.transactionNumber.trim() || undefined,
      cashAccountId: draft.cashAccountId,
      type: draft.type,
      direction: draft.direction,
      status: draft.status,
      dateFrom: dateOnlyPickerToApi(draft.dateRange?.[0]) || undefined,
      dateTo: dateOnlyPickerToApi(draft.dateRange?.[1]) || undefined,
    });
    setPage(1);
  }

  function resetFilters() {
    setDraft(EMPTY_FILTERS);
    setFilters({});
    setPage(1);
  }

  const columns: ColumnsType<CashTransaction> = [
    {
      title: CASH_LABELS.columns.date,
      dataIndex: "transactionDate",
      width: 150,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: CASH_LABELS.columns.number,
      dataIndex: "transactionNumber",
      width: 150,
      render: (value: string) => <CodeText value={value} />,
    },
    {
      title: CASH_LABELS.fields.account,
      dataIndex: "cashAccountName",
      width: 180,
      render: (value: string | null, row) => (
        <Link to={`/cash/accounts/${row.cashAccountId}`}>{value || "—"}</Link>
      ),
    },
    {
      title: CASH_LABELS.columns.type,
      dataIndex: "type",
      width: 155,
      render: transactionTypeLabel,
    },
    {
      title: CASH_LABELS.columns.status,
      dataIndex: "status",
      width: 125,
      render: (status: string) => (
        <Tag color={status === "CANCELLED" ? "default" : "success"}>
          {transactionStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: CASH_LABELS.columns.amount,
      dataIndex: "amount",
      align: "right",
      width: 140,
      render: (value: string, row) => (
        <span
          className={
            row.direction === "IN"
              ? "cash-transactions-money is-incoming"
              : "cash-transactions-money is-outgoing"
          }
        >
          {row.direction === "IN" ? "+" : "−"}
          <MoneyCell value={value} format={formatMoney} />
        </span>
      ),
    },
    {
      title: CASH_LABELS.columns.partner,
      dataIndex: "partnerName",
      width: 175,
      render: (value: string | null, row) =>
        value || row.expenseCategoryName || "—",
    },
    {
      title: CASH_LABELS.columns.createdBy,
      dataIndex: "createdByName",
      width: 160,
      render: (value: string | null) => value || "—",
    },
    {
      title: CASH_LABELS.columns.notes,
      dataIndex: "notes",
      ellipsis: true,
      render: (value: string | null) => value || "—",
    },
  ];

  return (
    <main className="cash-transactions-page">
      <PageHeader
        title={CASH_LABELS.allTransactionsTitle}
        description={CASH_LABELS.allTransactionsDescription}
        icon={phIcon(ArrowsDownUp, { size: ICON_SIZE.lg, weight: "duotone" })}
        extra={<Tag color="blue">{total}</Tag>}
      />

      <Card className="cash-transactions-filter-card">
        <FilterBar onReset={resetFilters} onSearch={applyFilters}>
          <div className="cash-transactions-filters">
            <FilterField label={CASH_LABELS.filters.transactionNumber}>
              <Input
                allowClear
                value={draft.transactionNumber}
                placeholder={CASH_LABELS.filters.transactionNumberPlaceholder}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    transactionNumber: event.target.value,
                  }))
                }
                onPressEnter={applyFilters}
              />
            </FilterField>
            <FilterField label={CASH_LABELS.filters.account}>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                value={draft.cashAccountId}
                placeholder={CASH_LABELS.selectAccountPlaceholder}
                loading={accounts.isLoading}
                options={(accounts.data?.data ?? []).map((account) => ({
                  value: account.id,
                  label: `${account.name} · ${account.code}`,
                }))}
                onChange={(cashAccountId) =>
                  setDraft((current) => ({ ...current, cashAccountId }))
                }
              />
            </FilterField>
            <FilterField label={CASH_LABELS.filters.type}>
              <Select
                allowClear
                value={draft.type}
                placeholder={CASH_LABELS.filters.all}
                options={Object.entries(CASH_LABELS.types).map(
                  ([value, label]) => ({ value, label }),
                )}
                onChange={(type) =>
                  setDraft((current) => ({ ...current, type }))
                }
              />
            </FilterField>
            <FilterField label={CASH_LABELS.filters.direction}>
              <Select
                allowClear
                value={draft.direction}
                placeholder={CASH_LABELS.filters.all}
                options={[
                  { value: "IN", label: CASH_LABELS.filters.incoming },
                  { value: "OUT", label: CASH_LABELS.filters.outgoing },
                ]}
                onChange={(direction) =>
                  setDraft((current) => ({ ...current, direction }))
                }
              />
            </FilterField>
            <FilterField label={CASH_LABELS.filters.txnStatus}>
              <Select
                allowClear
                value={draft.status}
                placeholder={CASH_LABELS.filters.all}
                options={[
                  { value: "POSTED", label: CASH_LABELS.statuses.POSTED },
                  { value: "CANCELLED", label: CASH_LABELS.statuses.CANCELLED },
                ]}
                onChange={(status) =>
                  setDraft((current) => ({ ...current, status }))
                }
              />
            </FilterField>
            <FilterField label={CASH_LABELS.filters.dateRange}>
              <RangePicker
                value={draft.dateRange}
                format={DATE_DISPLAY_FORMAT}
                onChange={(dateRange) =>
                  setDraft((current) => ({ ...current, dateRange }))
                }
              />
            </FilterField>
          </div>
        </FilterBar>
      </Card>

      {transactions.isError ? (
        <Alert
          className="cash-transactions-alert"
          type="error"
          showIcon
          message={mapApiError(transactions.error).userMessage}
          action={
            <Button size="small" onClick={() => void transactions.refetch()}>
              {CASH_LABELS.retry}
            </Button>
          }
        />
      ) : null}

      {isDesktop ? (
        <div className="cash-transactions-table-shell">
          <Table<CashTransaction>
            rowKey="id"
            loading={transactions.isLoading}
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 1320 }}
            locale={{ emptyText: CASH_LABELS.emptyTxns }}
          />
        </div>
      ) : (
        <div className="cash-transactions-mobile-list">
          {transactions.isLoading ? (
            <Card className="cash-transactions-mobile-card" loading />
          ) : null}
          {!transactions.isLoading && rows.length === 0 ? (
            <Card className="cash-transactions-empty">
              <Empty description={CASH_LABELS.emptyTxns} />
            </Card>
          ) : null}
          {rows.map((row) => (
            <Card
              key={row.id}
              className={`cash-transactions-mobile-card${
                row.status === "CANCELLED" ? " is-cancelled" : ""
              }`}
            >
              <div className="cash-transactions-mobile-top">
                <div className="cash-transactions-mobile-type">
                  <span
                    className={`cash-transactions-direction-icon ${
                      row.direction === "IN" ? "is-incoming" : "is-outgoing"
                    }`}
                  >
                    {phIcon(row.direction === "IN" ? ArrowDown : ArrowUp, {
                      size: ICON_SIZE.md,
                      weight: "bold",
                    })}
                  </span>
                  <div>
                    <Text strong>{transactionTypeLabel(row.type)}</Text>
                    <CodeText value={row.transactionNumber} />
                  </div>
                </div>
                <div className="cash-transactions-mobile-result">
                  <strong
                    className={`cash-transactions-mobile-amount ${
                      row.direction === "IN" ? "is-incoming" : "is-outgoing"
                    }`}
                  >
                    {row.direction === "IN" ? "+" : "−"}
                    {formatMoney(row.amount)}
                  </strong>
                  <Tag
                    color={row.status === "CANCELLED" ? "default" : "success"}
                  >
                    {transactionStatusLabel(row.status)}
                  </Tag>
                </div>
              </div>
              <div className="cash-transactions-mobile-meta">
                <span>
                  {phIcon(CalendarBlank, { size: ICON_SIZE.sm })}
                  {formatDateTime(row.transactionDate)}
                </span>
                <Link to={`/cash/accounts/${row.cashAccountId}`}>
                  {phIcon(Wallet, { size: ICON_SIZE.sm })}
                  {row.cashAccountName || "—"}
                </Link>
                {row.partnerName ? (
                  <span className="cash-transactions-mobile-partner">
                    {phIcon(User, { size: ICON_SIZE.sm })}
                    <strong>{row.partnerName}</strong>
                  </span>
                ) : row.expenseCategoryName ? (
                  <span>
                    {phIcon(NoteBlank, { size: ICON_SIZE.sm })}
                    {row.expenseCategoryName}
                  </span>
                ) : null}
                <span>
                  {phIcon(User, { size: ICON_SIZE.sm })}
                  {row.createdByName || "—"}
                </span>
              </div>
              {row.notes ? (
                <div className="cash-transactions-mobile-note">
                  {phIcon(NoteBlank, { size: ICON_SIZE.sm })}
                  <Text>{row.notes}</Text>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      {total > 0 ? (
        <div className="cash-transactions-pagination">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            responsive
            onChange={(nextPage, nextSize) => {
              setPage(nextPage);
              setPageSize(nextSize);
            }}
          />
        </div>
      ) : null}
    </main>
  );
}
