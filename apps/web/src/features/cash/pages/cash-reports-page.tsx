import { useMemo, useState } from 'react';
import {
  Alert,
  Card,
  Col,
  DatePicker,
  Empty,
  Grid,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ChartLine, WarningCircle } from '@phosphor-icons/react';
import dayjs, { type Dayjs } from 'dayjs';
import { mapApiError } from '../../../api/map-api-error';
import {
  dateOnlyPickerToApi,
  DATE_DISPLAY_FORMAT,
} from '../../../shared/datetime';
import { formatMoney } from '../../../shared/money/format-money';
import { formatDateTime } from '../../../shared/ui/format';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import { CodeText, MoneyCell } from '../../../shared/ui/table-cells';
import { FilterBar, FilterField } from '../../master-data/ui/list-toolbar';
import { PageHeader } from '../../master-data/ui/page-header';
import type { CashStatementLine } from '../api/cash.api';
import {
  useCashAccountStatement,
  useCashAccountsList,
  useCashPeriodSummary,
} from '../api/cash.hooks';
import { CASH_LABELS } from '../ui/labels';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

function typeLabel(type: string): string {
  return CASH_LABELS.types[type as keyof typeof CASH_LABELS.types] ?? '—';
}

function statusLabel(status: string): string {
  return CASH_LABELS.statuses[status as 'POSTED' | 'CANCELLED'] ?? '—';
}

function SummaryStat(props: {
  label: string;
  value: string | number;
  danger?: boolean;
}) {
  return (
    <Card className="ui-summary-card cash-report-stat" size="small">
      <Text type="secondary">{props.label}</Text>
      <div>
        <Text
          strong
          style={{ fontSize: 18 }}
          type={props.danger ? 'danger' : undefined}
        >
          {typeof props.value === 'number'
            ? props.value
            : formatMoney(props.value)}
        </Text>
      </div>
    </Card>
  );
}

export function CashReportsPage() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().startOf('month'),
    dayjs(),
  ]);
  const [accountId, setAccountId] = useState<string | undefined>();

  const dateFrom = dateRange[0] ? dateOnlyPickerToApi(dateRange[0]) : undefined;
  const dateTo = dateRange[1] ? dateOnlyPickerToApi(dateRange[1]) : undefined;

  const summaryQuery = useMemo(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      cashAccountId: accountId,
    }),
    [dateFrom, dateTo, accountId],
  );

  const statementQuery = useMemo(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [dateFrom, dateTo],
  );

  const accounts = useCashAccountsList({
    page: 1,
    pageSize: 100,
    isActive: true,
  });
  const summary = useCashPeriodSummary(summaryQuery);
  const statement = useCashAccountStatement(accountId, statementQuery);

  const accountOptions = (accounts.data?.data ?? []).map((account) => ({
    value: account.id,
    label: `${account.name} (${account.code})`,
  }));

  const summaryError = summary.isError
    ? mapApiError(summary.error).userMessage
    : undefined;
  const statementError = statement.isError
    ? mapApiError(statement.error).userMessage
    : undefined;

  const columns: ColumnsType<CashStatementLine> = [
    {
      title: CASH_LABELS.columns.date,
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      width: 140,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: CASH_LABELS.columns.number,
      dataIndex: 'transactionNumber',
      key: 'transactionNumber',
      width: 130,
      render: (value: string) => <CodeText value={value} />,
    },
    {
      title: CASH_LABELS.columns.type,
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => typeLabel(type),
    },
    {
      title: CASH_LABELS.columns.status,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'CANCELLED' ? 'default' : 'success'}>
          {statusLabel(status)}
        </Tag>
      ),
    },
    {
      title: CASH_LABELS.columns.partner,
      dataIndex: 'partnerName',
      key: 'partnerName',
      render: (value: string | null, row) =>
        value ?? row.expenseCategoryName ?? '—',
    },
    {
      title: CASH_LABELS.columns.amount,
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
    {
      title: CASH_LABELS.signedEffect,
      dataIndex: 'signedEffect',
      key: 'signedEffect',
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
    {
      title: CASH_LABELS.runningBalance,
      dataIndex: 'runningBalance',
      key: 'runningBalance',
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
  ];

  return (
    <div className="ui-page ui-report-page cash-reports-page">
      <PageHeader
        title={CASH_LABELS.reportsTitle}
        description={CASH_LABELS.reportsDescription}
        icon={phIcon(ChartLine, { size: ICON_SIZE.xl, weight: 'duotone' })}
      />

      <FilterBar>
        <FilterField label={CASH_LABELS.dateRange}>
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            format={DATE_DISPLAY_FORMAT}
            value={dateRange}
            onChange={(values) => {
              setDateRange([values?.[0] ?? null, values?.[1] ?? null]);
            }}
            allowClear
          />
        </FilterField>
        <FilterField label={CASH_LABELS.selectAccountForStatement}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={CASH_LABELS.selectAccountPlaceholder}
            options={accountOptions}
            value={accountId}
            onChange={(value) => setAccountId(value)}
            style={{ width: '100%', minWidth: 220 }}
          />
        </FilterField>
      </FilterBar>

      <Title level={5} style={{ marginTop: 8 }}>
        {CASH_LABELS.periodSummaryTitle}
      </Title>

      {summaryError ? (
        <Alert
          type="error"
          showIcon
          icon={phIcon(WarningCircle, { size: ICON_SIZE.md })}
          message={summaryError}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Row
        className="ui-summary-grid"
        gutter={[12, 12]}
        style={{ marginBottom: 24 }}
      >
        <Col xs={24} sm={12} lg={8} xl={6}>
          <SummaryStat
            label={CASH_LABELS.totalCompanyCash}
            value={summary.data?.totalCompanyCash ?? '0.00'}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <SummaryStat
            label={CASH_LABELS.cashInTotal}
            value={summary.data?.cashInTotal ?? '0.00'}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <SummaryStat
            label={CASH_LABELS.cashOutTotal}
            value={summary.data?.cashOutTotal ?? '0.00'}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <SummaryStat
            label={CASH_LABELS.expenseTotal}
            value={summary.data?.expenseTotal ?? '0.00'}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <SummaryStat
            label={CASH_LABELS.transferTotal}
            value={summary.data?.transferTotal ?? '0.00'}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <SummaryStat
            label={CASH_LABELS.partnerCashInTotal}
            value={summary.data?.partnerCashInTotal ?? '0.00'}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <SummaryStat
            label={CASH_LABELS.partnerCashOutTotal}
            value={summary.data?.partnerCashOutTotal ?? '0.00'}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <SummaryStat
            label={CASH_LABELS.cancelledCount}
            value={summary.data?.cancelledCount ?? 0}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <SummaryStat
            label={CASH_LABELS.reversalCount}
            value={summary.data?.reversalCount ?? 0}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <SummaryStat
            label={CASH_LABELS.negativeAccountCount}
            value={summary.data?.negativeAccountCount ?? 0}
            danger={(summary.data?.negativeAccountCount ?? 0) > 0}
          />
        </Col>
      </Row>

      {(summary.data?.expensesByCategory.length ?? 0) > 0 ? (
        <Card
          className="ui-report-breakdown-card"
          size="small"
          title={CASH_LABELS.expensesByCategory}
          style={{ marginBottom: 24 }}
          loading={summary.isLoading}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {summary.data?.expensesByCategory.map((row) => (
              <Space
                key={row.expenseCategoryId ?? row.expenseCategoryName}
                style={{ width: '100%', justifyContent: 'space-between' }}
              >
                <Text>{row.expenseCategoryName}</Text>
                <Text strong>{formatMoney(row.total)}</Text>
              </Space>
            ))}
          </Space>
        </Card>
      ) : null}

      <Title level={5}>{CASH_LABELS.statementTitle}</Title>

      {!accountId ? (
        <Empty description={CASH_LABELS.loadStatementHint} />
      ) : (
        <>
          {statementError ? (
            <Alert
              type="error"
              showIcon
              message={statementError}
              style={{ marginBottom: 16 }}
            />
          ) : null}

          {statement.data ? (
            <Space wrap size={16} style={{ marginBottom: 12 }}>
              <Text>
                {CASH_LABELS.openingBalance}:{' '}
                <Text strong>{formatMoney(statement.data.openingBalance)}</Text>
              </Text>
              <Text>
                {CASH_LABELS.closingBalance}:{' '}
                <Text strong>{formatMoney(statement.data.closingBalance)}</Text>
              </Text>
              <Text>
                {CASH_LABELS.currentBalanceLabel}:{' '}
                <Text strong>{formatMoney(statement.data.currentBalance)}</Text>
              </Text>
              <CodeText value={statement.data.cashAccountCode} />
            </Space>
          ) : null}

          {isMobile ? (
            <Space className="ui-mobile-list" direction="vertical" size={12}>
              {(statement.data?.lines ?? []).map((row) => (
                <Card
                  className="ui-mobile-card ui-ledger-card"
                  key={row.id}
                  size="small"
                >
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: '100%' }}
                  >
                    <Space wrap>
                      <CodeText value={row.transactionNumber} />
                      <Tag
                        color={
                          row.status === 'CANCELLED' ? 'default' : 'success'
                        }
                      >
                        {statusLabel(row.status)}
                      </Tag>
                    </Space>
                    <Text>{typeLabel(row.type)}</Text>
                    <Text type="secondary">
                      {formatDateTime(row.transactionDate)}
                    </Text>
                    <Text>
                      {CASH_LABELS.signedEffect}:{' '}
                      {formatMoney(row.signedEffect)}
                    </Text>
                    <Text strong>
                      {CASH_LABELS.runningBalance}:{' '}
                      {formatMoney(row.runningBalance)}
                    </Text>
                  </Space>
                </Card>
              ))}
              {!statement.isLoading &&
              (statement.data?.lines.length ?? 0) === 0 ? (
                <Empty description={CASH_LABELS.emptyStatement} />
              ) : null}
            </Space>
          ) : (
            <Table
              rowKey="id"
              size="small"
              loading={statement.isLoading}
              columns={columns}
              dataSource={statement.data?.lines ?? []}
              pagination={{ pageSize: 50, showSizeChanger: true }}
              scroll={{ x: 1100 }}
              locale={{ emptyText: CASH_LABELS.emptyStatement }}
            />
          )}
        </>
      )}
    </div>
  );
}
