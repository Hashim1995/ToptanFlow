import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Grid,
  Input,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  NoteBlank,
  Package,
  PencilSimple,
  Printer,
  Scales,
  ShoppingBag,
  Trash,
  WarningCircle,
  Wallet,
  XCircle,
} from '@phosphor-icons/react';
import { mapApiError } from '../../../api/map-api-error';
import { debtBalanceSignLabel } from '../../../shared/money/debt-balance-label';
import { formatMoney } from '../../../shared/money/format-money';
import {
  emptyDash,
  formatDateTime,
  formatQuantity,
} from '../../../shared/ui/format';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import { printCommercialDocument } from '../../../shared/ui/print-commercial-document';
import { PrintableCommercialDocument } from '../../../shared/ui/printable-commercial-document';
import {
  CodeText,
  EntityCell,
  MoneyCell,
} from '../../../shared/ui/table-cells';
import { CASH_LABELS } from '../../cash/ui/labels';
import { useProductsList } from '../../master-data/api/products.hooks';
import { PageHeader } from '../../master-data/ui/page-header';
import type {
  SaleDebtMovement,
  SaleItem,
  SaleLinkedCashTransaction,
  SaleQuantityHistory,
  SaleStatus,
} from '../api/sales.api';
import {
  useCancelSale,
  usePostSale,
  useRemoveSale,
  useSale,
} from '../api/sales.hooks';
import { SaleFormModal } from '../ui/sale-form-modal';
import { SALES_LABELS, saleStatusLabel } from '../ui/labels';
import { computeQuantityShortages } from '../ui/quantity-shortage';
import { SalePostConfirmModal } from '../ui/sale-post-confirm-modal';
import '../../../shared/ui/commercial-documents.css';

const { Text, Title } = Typography;

function statusColor(status: SaleStatus) {
  return status === 'POSTED'
    ? 'success'
    : status === 'CANCELLED'
      ? 'error'
      : 'warning';
}

const quantityKindLabels: Record<string, string> = {
  PURCHASE: 'Alış',
  PURCHASE_RETURN: 'Alış qaytarılması',
  SALE: 'Satış',
  SALE_RETURN: 'Satış qaytarılması',
  INITIAL_QUANTITY: 'İlkin miqdar',
  MANUAL_ADJUSTMENT: 'Miqdar düzəlişi',
  CANCELLATION_REVERSAL: 'Ləğv geri qaytarması',
};
const debtKindLabels: Record<string, string> = {
  PURCHASE: 'Alış',
  PURCHASE_RETURN: 'Alış qaytarılması',
  PURCHASE_CANCELLATION: 'Alışın ləğvi',
  SALE: 'Satış',
  SALE_RETURN: 'Satış qaytarılması',
  SALE_CANCELLATION: 'Satışın ləğvi',
  CASH_RECEIPT: 'Pul mədaxili',
  CASH_PAYMENT: 'Pul məxarici',
  MANUAL_ADJUSTMENT: 'Borc düzəlişi',
  OPENING_BALANCE: 'İlkin qalıq',
  REVERSAL: 'Geri qaytarma',
};

export function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);
  const sale = useSale(id);
  const products = useProductsList({
    pageSize: 100,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const postMutation = usePostSale();
  const removeMutation = useRemoveSale();
  const cancelMutation = useCancelSale();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);

  const productById = useMemo(() => {
    const map = new Map<string, { currentQuantity: string }>();
    for (const product of products.data?.data ?? []) {
      map.set(product.id, { currentQuantity: product.currentQuantity });
    }
    return map;
  }, [products.data?.data]);

  if (sale.isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin tip={SALES_LABELS.messages.loading} />
      </div>
    );
  }
  if (sale.isError || !sale.data) {
    return (
      <Alert
        type="error"
        showIcon
        icon={phIcon(WarningCircle, { weight: 'fill' })}
        message={
          sale.error
            ? mapApiError(sale.error).userMessage
            : SALES_LABELS.messages.loadError
        }
        action={
          <Button onClick={() => void sale.refetch()}>
            {SALES_LABELS.actions.retry}
          </Button>
        }
      />
    );
  }
  const record = sale.data;
  const totalLineQuantity = record.items.reduce(
    (sum, item) => sum + (Number.parseFloat(item.quantity) || 0),
    0,
  );
  const currentDebt = Number.parseFloat(record.partner.currentDebtBalance) || 0;
  const documentTotal = Number.parseFloat(record.totalAmount) || 0;
  const projectedDebt =
    record.status === 'DRAFT' ? currentDebt + documentTotal : undefined;
  const shortages = computeQuantityShortages(
    record.items,
    products.data?.data ?? [],
  );

  function confirmRemove() {
    Modal.confirm({
      className: 'app-mobile-modal',
      title: SALES_LABELS.remove.title,
      content: SALES_LABELS.remove.text,
      okText: SALES_LABELS.actions.remove,
      cancelText: SALES_LABELS.actions.back,
      okButtonProps: { danger: true },
      icon: phIcon(WarningCircle, { size: ICON_SIZE.xl, weight: 'fill' }),
      onOk: async () => {
        try {
          await removeMutation.mutateAsync(record.id);
          message.success(SALES_LABELS.remove.success);
          navigate('/sales');
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  const itemColumns: ColumnsType<SaleItem> = [
    {
      title: '#',
      key: 'index',
      width: 48,
      render: (_value, _row, index) => (
        <Text type="secondary">{index + 1}</Text>
      ),
    },
    {
      title: SALES_LABELS.fields.product,
      key: 'product',
      render: (_, item) => (
        <EntityCell
          code={item.productCodeSnapshot}
          name={item.productNameSnapshot}
          secondary={item.unitNameSnapshot}
        />
      ),
    },
    {
      title: SALES_LABELS.fields.availableQuantity,
      key: 'availableQuantity',
      width: 120,
      align: 'right',
      render: (_, item) => {
        const current = productById.get(item.productId)?.currentQuantity;
        return current != null ? formatQuantity(current) : emptyDash(null);
      },
    },
    {
      title: SALES_LABELS.fields.quantity,
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      align: 'right',
      render: (value: string) => formatQuantity(value),
    },
    {
      title: SALES_LABELS.fields.unitPrice,
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 130,
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: SALES_LABELS.fields.lineDiscount,
      dataIndex: 'discountAmount',
      key: 'discount',
      width: 120,
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: SALES_LABELS.fields.lineTotal,
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      width: 130,
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
    ...(record.status === 'POSTED'
      ? [
          {
            title: SALES_LABELS.fields.costAtPosting,
            dataIndex: 'costAtPosting',
            key: 'costAtPosting',
            width: 150,
            align: 'right' as const,
            render: (value: string | null) =>
              value ? (
                <MoneyCell value={value} format={formatMoney} />
              ) : (
                emptyDash(value)
              ),
          },
        ]
      : []),
    {
      title: SALES_LABELS.fields.lineNotes,
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (value: string | null) => emptyDash(value),
    },
  ];

  const quantityColumns: ColumnsType<SaleQuantityHistory> = [
    {
      title: 'Hərəkət',
      dataIndex: 'kind',
      key: 'kind',
      render: (value: string) => (
        <Tag>{quantityKindLabels[value] ?? 'Digər hərəkət'}</Tag>
      ),
    },
    {
      title: SALES_LABELS.history.change,
      dataIndex: 'quantityChange',
      key: 'change',
      align: 'right',
      render: (value: string) => formatQuantity(value),
    },
    {
      title: SALES_LABELS.history.before,
      dataIndex: 'quantityBefore',
      key: 'before',
      align: 'right',
      render: (value: string) => formatQuantity(value),
    },
    {
      title: SALES_LABELS.history.after,
      dataIndex: 'quantityAfter',
      key: 'after',
      align: 'right',
      render: (value: string) => formatQuantity(value),
    },
    {
      title: SALES_LABELS.history.reason,
      dataIndex: 'reason',
      key: 'reason',
      render: (value: string | null) => emptyDash(value),
    },
    {
      title: SALES_LABELS.history.date,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const debtColumns: ColumnsType<SaleDebtMovement> = [
    {
      title: 'Hərəkət',
      dataIndex: 'kind',
      key: 'kind',
      render: (value: string) => (
        <Tag>{debtKindLabels[value] ?? 'Digər hərəkət'}</Tag>
      ),
    },
    {
      title: SALES_LABELS.history.signedAmount,
      dataIndex: 'signedAmount',
      key: 'signedAmount',
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
    {
      title: SALES_LABELS.history.before,
      dataIndex: 'balanceBefore',
      key: 'before',
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: SALES_LABELS.history.after,
      dataIndex: 'balanceAfter',
      key: 'after',
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: SALES_LABELS.history.reason,
      dataIndex: 'reason',
      key: 'reason',
      render: (value: string | null) => emptyDash(value),
    },
    {
      title: SALES_LABELS.history.date,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const cashColumns: ColumnsType<SaleLinkedCashTransaction> = [
    {
      title: SALES_LABELS.history.transactionNumber,
      dataIndex: 'transactionNumber',
      key: 'transactionNumber',
      render: (value: string) => <CodeText value={value} />,
    },
    {
      title: SALES_LABELS.history.cashAccount,
      key: 'cashAccount',
      render: (_: unknown, row) => (
        <Link to={`/cash/accounts/${row.cashAccountId}`}>
          {row.cashAccountName} ({row.cashAccountCode})
        </Link>
      ),
    },
    {
      title: 'Növ',
      dataIndex: 'type',
      key: 'type',
      render: (value: string) => (
        <Tag>
          {CASH_LABELS.types[value as keyof typeof CASH_LABELS.types] ??
            'Digər'}
        </Tag>
      ),
    },
    {
      title: SALES_LABELS.history.amount,
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
    {
      title: SALES_LABELS.columns.status,
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => (
        <Tag
          color={
            value === 'POSTED'
              ? 'success'
              : value === 'CANCELLED'
                ? 'error'
                : 'default'
          }
        >
          {CASH_LABELS.statuses[value as keyof typeof CASH_LABELS.statuses] ??
            value}
        </Tag>
      ),
    },
    {
      title: SALES_LABELS.history.date,
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      width: 140,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const auditItems = [
    {
      key: 'status',
      label: SALES_LABELS.columns.status,
      children: (
        <Tag color={statusColor(record.status)}>
          {saleStatusLabel(record.status)}
        </Tag>
      ),
    },
    {
      key: 'document',
      label: SALES_LABELS.columns.documentNumber,
      children: <CodeText value={record.documentNumber} strong />,
    },
    {
      key: 'date',
      label: SALES_LABELS.columns.businessDate,
      children: formatDateTime(record.businessDate),
    },
    {
      key: 'partner',
      label: SALES_LABELS.columns.partner,
      children: (
        <EntityCell code={record.partner.code} name={record.partner.name} />
      ),
    },
    {
      key: 'debt',
      label: SALES_LABELS.fields.partnerDebt,
      children: (
        <Space direction="vertical" size={0}>
          <Text strong>{formatMoney(record.partner.currentDebtBalance)}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {debtBalanceSignLabel(record.partner.currentDebtBalance)}
          </Text>
        </Space>
      ),
    },
    {
      key: 'itemCount',
      label: SALES_LABELS.fields.itemCount,
      children: record.items.length,
    },
    {
      key: 'totalQuantity',
      label: SALES_LABELS.fields.totalQuantity,
      children: formatQuantity(totalLineQuantity),
    },
    ...(projectedDebt != null
      ? [
          {
            key: 'projectedDebt',
            label: SALES_LABELS.fields.projectedDebt,
            children: (
              <Space direction="vertical" size={0}>
                <Text strong>{formatMoney(projectedDebt)}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {debtBalanceSignLabel(projectedDebt)}
                </Text>
              </Space>
            ),
          },
        ]
      : []),
    {
      key: 'notes',
      label: SALES_LABELS.fields.notes,
      children: emptyDash(record.notes),
      span: 2,
    },
  ];

  const auditTrailItems = [
    {
      key: 'createdBy',
      label: SALES_LABELS.audit.createdBy,
      children: record.createdBy.fullName,
    },
    {
      key: 'createdAt',
      label: SALES_LABELS.columns.createdAt,
      children: formatDateTime(record.createdAt),
    },
    {
      key: 'postedBy',
      label: SALES_LABELS.audit.postedBy,
      children: emptyDash(record.postedBy?.fullName),
    },
    {
      key: 'postedAt',
      label: SALES_LABELS.audit.postedAt,
      children: formatDateTime(record.postedAt),
    },
    {
      key: 'cancelledBy',
      label: SALES_LABELS.audit.cancelledBy,
      children: emptyDash(record.cancelledBy?.fullName),
    },
    {
      key: 'cancelledAt',
      label: SALES_LABELS.audit.cancelledAt,
      children: formatDateTime(record.cancelledAt),
    },
    {
      key: 'cancelReason',
      label: SALES_LABELS.audit.cancelReason,
      children: emptyDash(record.cancelReason),
      span: 2,
    },
    ...(record.negativeQuantityOverrideReason
      ? [
          {
            key: 'negativeQuantityOverrideReason',
            label: SALES_LABELS.audit.negativeQuantityOverrideReason,
            children: record.negativeQuantityOverrideReason,
            span: 2 as const,
          },
        ]
      : []),
  ];

  return (
    <div className="ui-page ui-detail-page ui-document-detail-page commercial-document-detail sale-detail-page">
      <PageHeader
        title={record.documentNumber}
        description={SALES_LABELS.detail}
        icon={phIcon(ShoppingBag, { size: ICON_SIZE.xl, weight: 'duotone' })}
        extra={
          <Space wrap>
            <Button
              icon={phIcon(ArrowLeft, { size: ICON_SIZE.md })}
              onClick={() => navigate('/sales')}
            >
              {SALES_LABELS.actions.back}
            </Button>
            <Button
              className="commercial-print-trigger"
              icon={phIcon(Printer, { size: ICON_SIZE.md })}
              onClick={() => {
                const opened = printCommercialDocument(
                  'sale-print-document',
                  `${SALES_LABELS.printTitle} — ${record.documentNumber}`,
                );
                if (!opened)
                  void message.error(SALES_LABELS.messages.printOpenError);
              }}
            >
              {SALES_LABELS.actions.print}
            </Button>
            {record.status === 'DRAFT' ? (
              <>
                <Button
                  icon={phIcon(PencilSimple, { size: ICON_SIZE.md })}
                  onClick={() => setEditOpen(true)}
                >
                  {SALES_LABELS.actions.edit}
                </Button>
                <Button
                  type="primary"
                  icon={phIcon(CheckCircle, { size: ICON_SIZE.md })}
                  onClick={() => setPostOpen(true)}
                >
                  {SALES_LABELS.actions.post}
                </Button>
                <Button
                  danger
                  icon={phIcon(Trash, { size: ICON_SIZE.md })}
                  onClick={confirmRemove}
                >
                  {SALES_LABELS.actions.remove}
                </Button>
              </>
            ) : null}
            {record.status === 'POSTED' ? (
              <Button
                danger
                icon={phIcon(XCircle, { size: ICON_SIZE.md })}
                onClick={() => setCancelOpen(true)}
              >
                {SALES_LABELS.actions.cancel}
              </Button>
            ) : null}
          </Space>
        }
      />

      <Card className="commercial-detail-workspace" size="small">
        <PrintableCommercialDocument
          id="sale-print-document"
          title={SALES_LABELS.printTitle}
          documentNumber={record.documentNumber}
          status={saleStatusLabel(record.status)}
          businessDate={record.businessDate}
          partnerLabel={SALES_LABELS.columns.partner}
          partnerCode={record.partner.code}
          partnerName={record.partner.name}
          notes={record.notes}
          subtotalAmount={record.subtotalAmount}
          totalAmount={record.totalAmount}
          lines={record.items.map((item) => ({
            id: item.id,
            productCode: item.productCodeSnapshot,
            productName: item.productNameSnapshot,
            unitName: item.unitNameSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          }))}
        />
        <div className="commercial-detail-overview-grid">
          <section className="commercial-summary-card">
            <Space className="commercial-panel-heading" size={8}>
              {phIcon(FileText, { size: ICON_SIZE.md })}
              <span>Sənəd məlumatları</span>
            </Space>
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2, lg: 3 }}
              items={auditItems}
            />
          </section>

          <section className="commercial-audit-card">
            <Space className="commercial-panel-heading" size={8}>
              {phIcon(NoteBlank, { size: ICON_SIZE.md })}
              <span>{SALES_LABELS.audit.title}</span>
            </Space>
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2, lg: 2 }}
              items={auditTrailItems}
            />
          </section>
        </div>

        <section className="commercial-detail-section commercial-items-section">
          <Space className="commercial-section-heading" align="center">
            {phIcon(Package, { size: ICON_SIZE.md })}
            <Title level={5}>{SALES_LABELS.fields.items}</Title>
            <Tag>{record.items.length}</Tag>
          </Space>
          {isDesktop ? (
            <Table
              className="commercial-detail-table commercial-items-table"
              rowKey="id"
              size="small"
              columns={itemColumns}
              dataSource={record.items}
              pagination={false}
              scroll={{ x: record.status === 'POSTED' ? 1140 : 1040 }}
            />
          ) : (
            <div className="commercial-record-list">
              {record.items.map((item, index) => (
                <article className="commercial-record-card" key={item.id}>
                  <div className="commercial-record-card-head">
                    <EntityCell
                      code={item.productCodeSnapshot}
                      name={item.productNameSnapshot}
                      secondary={item.unitNameSnapshot}
                    />
                    <Text strong>{formatMoney(item.lineTotal)}</Text>
                  </div>
                  <div className="commercial-record-values">
                    <div>
                      <Text type="secondary">
                        {SALES_LABELS.fields.availableQuantity}
                      </Text>
                      <strong>
                        {productById.get(item.productId)?.currentQuantity !=
                        null
                          ? formatQuantity(
                              productById.get(item.productId)!.currentQuantity,
                            )
                          : emptyDash(null)}
                      </strong>
                    </div>
                    <div>
                      <Text type="secondary">
                        {SALES_LABELS.fields.quantity}
                      </Text>
                      <strong>{formatQuantity(item.quantity)}</strong>
                    </div>
                    <div>
                      <Text type="secondary">
                        {SALES_LABELS.fields.unitPrice}
                      </Text>
                      <strong>{formatMoney(item.unitPrice)}</strong>
                    </div>
                    <div>
                      <Text type="secondary">
                        {SALES_LABELS.fields.lineDiscount}
                      </Text>
                      <strong>{formatMoney(item.discountAmount)}</strong>
                    </div>
                    {record.status === 'POSTED' ? (
                      <div>
                        <Text type="secondary">
                          {SALES_LABELS.fields.costAtPosting}
                        </Text>
                        <strong>
                          {item.costAtPosting
                            ? formatMoney(item.costAtPosting)
                            : '—'}
                        </strong>
                      </div>
                    ) : null}
                  </div>
                  <Text className="commercial-record-note" type="secondary">
                    {index + 1}. {emptyDash(item.notes)}
                  </Text>
                </article>
              ))}
            </div>
          )}
          <div className="ui-document-totals commercial-totals-card">
            <Space size="large" wrap>
              <Text type="secondary">
                {SALES_LABELS.columns.subtotal}:{' '}
                {formatMoney(record.subtotalAmount)}
              </Text>
              <Text type="secondary">
                {SALES_LABELS.columns.discount}:{' '}
                {formatMoney(record.discountAmount ?? 0)}
              </Text>
              <Text strong>
                {SALES_LABELS.columns.total}: {formatMoney(record.totalAmount)}
              </Text>
            </Space>
          </div>
        </section>

        <div className="commercial-history-grid">
          <section className="commercial-detail-section">
            <Space className="commercial-section-heading" align="center">
              {phIcon(Scales, { size: ICON_SIZE.md })}
              <Title level={5}>{SALES_LABELS.history.quantity}</Title>
              <Tag>{record.productQuantityHistory.length}</Tag>
            </Space>
            {isDesktop ? (
              <Table
                className="commercial-detail-table commercial-history-table"
                rowKey="id"
                size="small"
                columns={quantityColumns}
                dataSource={record.productQuantityHistory}
                pagination={false}
                locale={{ emptyText: 'Miqdar hərəkəti yoxdur.' }}
                scroll={{ x: 640 }}
              />
            ) : (
              <div className="commercial-record-list commercial-history-list">
                {record.productQuantityHistory.map((row) => (
                  <article className="commercial-record-card" key={row.id}>
                    <div className="commercial-record-card-head">
                      <Tag>
                        {quantityKindLabels[row.kind] ?? 'Digər hərəkət'}
                      </Tag>
                      <Text>{formatDateTime(row.createdAt)}</Text>
                    </div>
                    <div className="commercial-record-values">
                      <div>
                        <Text type="secondary">
                          {SALES_LABELS.history.change}
                        </Text>
                        <strong>{formatQuantity(row.quantityChange)}</strong>
                      </div>
                      <div>
                        <Text type="secondary">
                          {SALES_LABELS.history.before}
                        </Text>
                        <strong>{formatQuantity(row.quantityBefore)}</strong>
                      </div>
                      <div>
                        <Text type="secondary">
                          {SALES_LABELS.history.after}
                        </Text>
                        <strong>{formatQuantity(row.quantityAfter)}</strong>
                      </div>
                    </div>
                    <Text className="commercial-record-note" type="secondary">
                      {SALES_LABELS.history.reason}: {emptyDash(row.reason)}
                    </Text>
                  </article>
                ))}
                {!record.productQuantityHistory.length ? (
                  <Text type="secondary">Miqdar hərəkəti yoxdur.</Text>
                ) : null}
              </div>
            )}
          </section>

          <section className="commercial-detail-section">
            <Space className="commercial-section-heading" align="center">
              {phIcon(NoteBlank, { size: ICON_SIZE.md })}
              <Title level={5}>{SALES_LABELS.history.debt}</Title>
              <Tag>{record.partnerDebtMovements.length}</Tag>
            </Space>
            {isDesktop ? (
              <Table
                className="commercial-detail-table commercial-history-table"
                rowKey="id"
                size="small"
                columns={debtColumns}
                dataSource={record.partnerDebtMovements}
                pagination={false}
                locale={{ emptyText: 'Borc hərəkəti yoxdur.' }}
                scroll={{ x: 700 }}
              />
            ) : (
              <div className="commercial-record-list commercial-history-list">
                {record.partnerDebtMovements.map((row) => (
                  <article className="commercial-record-card" key={row.id}>
                    <div className="commercial-record-card-head">
                      <Tag>{debtKindLabels[row.kind] ?? 'Digər hərəkət'}</Tag>
                      <Text strong>{formatMoney(row.signedAmount)}</Text>
                    </div>
                    <div className="commercial-record-values">
                      <div>
                        <Text type="secondary">
                          {SALES_LABELS.history.before}
                        </Text>
                        <strong>{formatMoney(row.balanceBefore)}</strong>
                      </div>
                      <div>
                        <Text type="secondary">
                          {SALES_LABELS.history.after}
                        </Text>
                        <strong>{formatMoney(row.balanceAfter)}</strong>
                      </div>
                      <div>
                        <Text type="secondary">
                          {SALES_LABELS.history.date}
                        </Text>
                        <strong>{formatDateTime(row.createdAt)}</strong>
                      </div>
                    </div>
                    <Text className="commercial-record-note" type="secondary">
                      {SALES_LABELS.history.reason}: {emptyDash(row.reason)}
                    </Text>
                  </article>
                ))}
                {!record.partnerDebtMovements.length ? (
                  <Text type="secondary">Borc hərəkəti yoxdur.</Text>
                ) : null}
              </div>
            )}
          </section>
        </div>

        <section className="commercial-detail-section commercial-cash-section">
          <div className="commercial-cash-heading">
            <Space className="commercial-section-heading" align="center">
              {phIcon(Wallet, { size: ICON_SIZE.md })}
              <Title level={5}>{SALES_LABELS.history.cash}</Title>
              <Tag>{record.cashTransactions?.length ?? 0}</Tag>
            </Space>
            <Text type="secondary">
              {SALES_LABELS.history.cashCancelledHint}
            </Text>
          </div>
          {isDesktop ? (
            <Table
              className="commercial-detail-table commercial-history-table"
              rowKey="id"
              size="small"
              columns={cashColumns}
              dataSource={record.cashTransactions ?? []}
              pagination={false}
              locale={{ emptyText: 'Əlaqəli kassa əməliyyatı yoxdur.' }}
              scroll={{ x: 800 }}
            />
          ) : (
            <div className="commercial-record-list commercial-history-list">
              {(record.cashTransactions ?? []).map((row) => (
                <article className="commercial-record-card" key={row.id}>
                  <div className="commercial-record-card-head">
                    <CodeText value={row.transactionNumber} />
                    <Text strong>{formatMoney(row.amount)}</Text>
                  </div>
                  <Link to={`/cash/accounts/${row.cashAccountId}`}>
                    {row.cashAccountName} ({row.cashAccountCode})
                  </Link>
                  <div className="commercial-record-values">
                    <div>
                      <Text type="secondary">Növ</Text>
                      <strong>
                        {CASH_LABELS.types[
                          row.type as keyof typeof CASH_LABELS.types
                        ] ?? 'Digər'}
                      </strong>
                    </div>
                    <div>
                      <Text type="secondary">
                        {SALES_LABELS.columns.status}
                      </Text>
                      <strong>
                        {CASH_LABELS.statuses[
                          row.status as keyof typeof CASH_LABELS.statuses
                        ] ?? row.status}
                      </strong>
                    </div>
                    <div>
                      <Text type="secondary">{SALES_LABELS.history.date}</Text>
                      <strong>{formatDateTime(row.transactionDate)}</strong>
                    </div>
                  </div>
                </article>
              ))}
              {!record.cashTransactions?.length ? (
                <Text type="secondary">Əlaqəli kassa əməliyyatı yoxdur.</Text>
              ) : null}
            </div>
          )}
        </section>
      </Card>

      <Modal
        className="ui-confirm-modal ui-cancel-confirm-modal commercial-confirm-modal"
        wrapClassName="commercial-modal-wrap"
        centered
        open={cancelOpen}
        title={
          <Space>
            {phIcon(XCircle, { weight: 'fill', size: ICON_SIZE.lg })}
            {SALES_LABELS.cancel.title}
          </Space>
        }
        okText={SALES_LABELS.actions.cancel}
        cancelText={SALES_LABELS.actions.back}
        okButtonProps={{ danger: true, disabled: !cancelReason.trim() }}
        confirmLoading={cancelMutation.isPending}
        onCancel={() => {
          setCancelOpen(false);
          setCancelReason('');
        }}
        onOk={async () => {
          if (!cancelReason.trim()) return;
          try {
            await cancelMutation.mutateAsync({
              id: record.id,
              reason: cancelReason.trim(),
            });
            message.success(SALES_LABELS.cancel.success);
            setCancelOpen(false);
            setCancelReason('');
          } catch (error) {
            message.error(mapApiError(error).userMessage);
          }
        }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text>{SALES_LABELS.cancel.text}</Text>
          <div>
            <Text strong>{SALES_LABELS.cancel.effectsTitle}</Text>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              {SALES_LABELS.cancel.effects.map((effect) => (
                <li key={effect}>
                  <Text type="secondary">{effect}</Text>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Text strong>{SALES_LABELS.cancel.reason}</Text>
            <Input.TextArea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder={SALES_LABELS.cancel.reasonPlaceholder}
              rows={3}
              maxLength={1000}
              showCount
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      <SalePostConfirmModal
        open={postOpen}
        confirmLoading={postMutation.isPending}
        shortages={shortages}
        documentTotal={record.totalAmount}
        partnerDebtBalance={record.partner.currentDebtBalance}
        onCancel={() => setPostOpen(false)}
        onConfirm={async (payload) => {
          try {
            await postMutation.mutateAsync({
              id: record.id,
              input: payload,
            });
            message.success(SALES_LABELS.post.success);
            setPostOpen(false);
          } catch (error) {
            message.error(mapApiError(error).userMessage);
            throw error;
          }
        }}
      />

      <SaleFormModal
        open={editOpen}
        saleId={record.id}
        onCancel={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          void sale.refetch();
        }}
      />
    </div>
  );
}
