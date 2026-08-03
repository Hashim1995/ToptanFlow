import { useMemo, useState } from "react";
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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarBlank,
  CheckCircle,
  FileText,
  NoteBlank,
  Package,
  PencilSimple,
  Printer,
  ShoppingCart,
  Trash,
  WarningCircle,
  Wallet,
  XCircle,
} from "@phosphor-icons/react";
import { mapApiError } from "../../../api/map-api-error";
import { debtBalanceSignLabel } from "../../../shared/money/debt-balance-label";
import { formatMoney } from "../../../shared/money/format-money";
import {
  emptyDash,
  formatDateTime,
  formatQuantity,
} from "../../../shared/ui/format";
import { ICON_SIZE, phIcon } from "../../../shared/ui/ph-icon";
import { printCommercialDocument } from "../../../shared/ui/print-commercial-document";
import { PrintableCommercialDocument } from "../../../shared/ui/printable-commercial-document";
import {
  CodeText,
  EntityCell,
  MoneyCell,
} from "../../../shared/ui/table-cells";
import { CASH_LABELS } from "../../cash/ui/labels";
import { useProductsList } from "../../master-data/api/products.hooks";
import { PageHeader } from "../../master-data/ui/page-header";
import type {
  PurchaseDebtMovement,
  PurchaseItem,
  PurchaseLinkedCashTransaction,
  PurchaseStatus,
} from "../api/purchases.api";
import {
  useCancelPurchase,
  usePostPurchase,
  usePurchase,
  useRemovePurchase,
} from "../api/purchases.hooks";
import { PurchaseFormModal } from "../ui/purchase-form-modal";
import { PurchasePostConfirmModal } from "../ui/purchase-post-confirm-modal";
import { PURCHASE_LABELS, purchaseStatusLabel } from "../ui/labels";
import "../../../shared/ui/commercial-documents.css";

const { Text, Title } = Typography;

function statusColor(status: PurchaseStatus) {
  return status === "POSTED"
    ? "success"
    : status === "CANCELLED"
      ? "error"
      : "warning";
}

const debtKindLabels: Record<string, string> = {
  PURCHASE: "Alış",
  PURCHASE_RETURN: "Alış qaytarılması",
  PURCHASE_CANCELLATION: "Alışın ləğvi",
  SALE: "Satış",
  SALE_RETURN: "Satış qaytarılması",
  SALE_CANCELLATION: "Satışın ləğvi",
  CASH_RECEIPT: "Pul mədaxili",
  CASH_PAYMENT: "Pul məxarici",
  MANUAL_ADJUSTMENT: "Borc düzəlişi",
  OPENING_BALANCE: "İlkin qalıq",
  REVERSAL: "Geri qaytarma",
};

export function PurchaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);
  const purchase = usePurchase(id);
  const products = useProductsList({
    pageSize: 100,
    sortBy: "name",
    sortOrder: "asc",
  });
  const postMutation = usePostPurchase();
  const removeMutation = useRemovePurchase();
  const cancelMutation = useCancelPurchase();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);

  const productById = useMemo(() => {
    const map = new Map<string, { currentQuantity: string }>();
    for (const product of products.data?.data ?? []) {
      map.set(product.id, { currentQuantity: product.currentQuantity });
    }
    return map;
  }, [products.data?.data]);

  if (purchase.isLoading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin tip={PURCHASE_LABELS.messages.loading} />
      </div>
    );
  }
  if (purchase.isError || !purchase.data) {
    return (
      <Alert
        type="error"
        showIcon
        icon={phIcon(WarningCircle, { weight: "fill" })}
        message={
          purchase.error
            ? mapApiError(purchase.error).userMessage
            : PURCHASE_LABELS.messages.loadError
        }
        action={
          <Button onClick={() => void purchase.refetch()}>
            {PURCHASE_LABELS.actions.retry}
          </Button>
        }
      />
    );
  }
  const record = purchase.data;
  const totalLineQuantity = record.items.reduce(
    (sum, item) => sum + (Number.parseFloat(item.quantity) || 0),
    0,
  );
  const currentDebt = Number.parseFloat(record.partner.currentDebtBalance) || 0;
  const documentTotal = Number.parseFloat(record.totalAmount) || 0;
  const projectedDebt =
    record.status === "DRAFT" ? currentDebt - documentTotal : undefined;

  function confirmPost() {
    setPostOpen(true);
  }

  function confirmRemove() {
    Modal.confirm({
      className: "app-mobile-modal",
      title: PURCHASE_LABELS.remove.title,
      content: PURCHASE_LABELS.remove.text,
      okText: PURCHASE_LABELS.actions.remove,
      cancelText: PURCHASE_LABELS.actions.back,
      okButtonProps: { danger: true },
      icon: phIcon(WarningCircle, { size: ICON_SIZE.xl, weight: "fill" }),
      onOk: async () => {
        try {
          await removeMutation.mutateAsync(record.id);
          message.success(PURCHASE_LABELS.remove.success);
          navigate("/purchases");
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  const itemColumns: ColumnsType<PurchaseItem> = [
    {
      title: "#",
      key: "index",
      width: 48,
      render: (_value, _row, index) => (
        <Text type="secondary">{index + 1}</Text>
      ),
    },
    {
      title: PURCHASE_LABELS.fields.product,
      key: "product",
      render: (_, item) => (
        <EntityCell
          code={item.productCodeSnapshot}
          name={item.productNameSnapshot}
          secondary={item.unitNameSnapshot}
        />
      ),
    },
    {
      title: PURCHASE_LABELS.fields.availableQuantity,
      key: "availableQuantity",
      width: 120,
      align: "right",
      render: (_, item) => {
        const current = productById.get(item.productId)?.currentQuantity;
        return current != null ? formatQuantity(current) : emptyDash(null);
      },
    },
    {
      title: PURCHASE_LABELS.fields.quantity,
      dataIndex: "quantity",
      key: "quantity",
      width: 110,
      align: "right",
      render: (value: string) => formatQuantity(value),
    },
    {
      title: PURCHASE_LABELS.fields.unitPrice,
      dataIndex: "unitPrice",
      key: "unitPrice",
      width: 130,
      align: "right",
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: PURCHASE_LABELS.fields.lineDiscount,
      dataIndex: "discountAmount",
      key: "discount",
      width: 120,
      align: "right",
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: PURCHASE_LABELS.fields.lineTotal,
      dataIndex: "lineTotal",
      key: "lineTotal",
      width: 130,
      align: "right",
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
    {
      title: PURCHASE_LABELS.fields.lineNotes,
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (value: string | null) => emptyDash(value),
    },
  ];

  const debtColumns: ColumnsType<PurchaseDebtMovement> = [
    {
      title: "Hərəkət",
      dataIndex: "kind",
      key: "kind",
      render: (value: string) => (
        <Tag>{debtKindLabels[value] ?? "Digər hərəkət"}</Tag>
      ),
    },
    {
      title: PURCHASE_LABELS.history.signedAmount,
      dataIndex: "signedAmount",
      key: "signedAmount",
      align: "right",
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
    {
      title: PURCHASE_LABELS.history.before,
      dataIndex: "balanceBefore",
      key: "before",
      align: "right",
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: PURCHASE_LABELS.history.after,
      dataIndex: "balanceAfter",
      key: "after",
      align: "right",
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: PURCHASE_LABELS.history.reason,
      dataIndex: "reason",
      key: "reason",
      render: (value: string | null) => emptyDash(value),
    },
    {
      title: PURCHASE_LABELS.history.date,
      dataIndex: "createdAt",
      key: "createdAt",
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const cashColumns: ColumnsType<PurchaseLinkedCashTransaction> = [
    {
      title: PURCHASE_LABELS.history.transactionNumber,
      dataIndex: "transactionNumber",
      key: "transactionNumber",
      render: (value: string) => <CodeText value={value} />,
    },
    {
      title: PURCHASE_LABELS.history.cashAccount,
      key: "cashAccount",
      render: (_: unknown, row) => (
        <Link to={`/cash/accounts/${row.cashAccountId}`}>
          {row.cashAccountName} ({row.cashAccountCode})
        </Link>
      ),
    },
    {
      title: "Növ",
      dataIndex: "type",
      key: "type",
      render: (value: string) => (
        <Tag>
          {CASH_LABELS.types[value as keyof typeof CASH_LABELS.types] ??
            "Digər"}
        </Tag>
      ),
    },
    {
      title: PURCHASE_LABELS.history.amount,
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
    {
      title: PURCHASE_LABELS.columns.status,
      dataIndex: "status",
      key: "status",
      render: (value: string) => (
        <Tag
          color={
            value === "POSTED"
              ? "success"
              : value === "CANCELLED"
                ? "error"
                : "default"
          }
        >
          {CASH_LABELS.statuses[value as keyof typeof CASH_LABELS.statuses] ??
            value}
        </Tag>
      ),
    },
    {
      title: PURCHASE_LABELS.history.date,
      dataIndex: "transactionDate",
      key: "transactionDate",
      width: 140,
      render: (value: string) => formatDateTime(value),
    },
  ];

  return (
    <div className="ui-page ui-detail-page ui-document-detail-page commercial-document-detail purchase-detail-page">
      <PageHeader
        title={record.documentNumber}
        description={PURCHASE_LABELS.detail}
        icon={phIcon(ShoppingCart, { size: ICON_SIZE.xl, weight: "duotone" })}
        extra={
          <Space wrap>
            <Button
              icon={phIcon(ArrowLeft, { size: ICON_SIZE.md })}
              onClick={() => navigate("/purchases")}
            >
              {PURCHASE_LABELS.actions.back}
            </Button>
            <Button
              className="commercial-print-trigger"
              icon={phIcon(Printer, { size: ICON_SIZE.md })}
              onClick={() => {
                const opened = printCommercialDocument(
                  "purchase-print-document",
                  `${PURCHASE_LABELS.printTitle} — ${record.documentNumber}`,
                );
                if (!opened)
                  void message.error(PURCHASE_LABELS.messages.printOpenError);
              }}
            >
              {PURCHASE_LABELS.actions.print}
            </Button>
            {record.status === "DRAFT" ? (
              <>
                <Button
                  icon={phIcon(PencilSimple, { size: ICON_SIZE.md })}
                  onClick={() => setEditOpen(true)}
                >
                  {PURCHASE_LABELS.actions.edit}
                </Button>
                <Button
                  type="primary"
                  icon={phIcon(CheckCircle, { size: ICON_SIZE.md })}
                  onClick={confirmPost}
                >
                  {PURCHASE_LABELS.actions.post}
                </Button>
                <Button
                  danger
                  icon={phIcon(Trash, { size: ICON_SIZE.md })}
                  onClick={confirmRemove}
                >
                  {PURCHASE_LABELS.actions.remove}
                </Button>
              </>
            ) : null}
            {record.status === "POSTED" ? (
              <Button
                danger
                icon={phIcon(XCircle, { size: ICON_SIZE.md })}
                onClick={() => setCancelOpen(true)}
              >
                {PURCHASE_LABELS.actions.cancel}
              </Button>
            ) : null}
          </Space>
        }
      />

      <Card className="commercial-detail-workspace" size="small">
        <PrintableCommercialDocument
          id="purchase-print-document"
          title={PURCHASE_LABELS.printTitle}
          documentNumber={record.documentNumber}
          status={purchaseStatusLabel(record.status)}
          businessDate={record.businessDate}
          partnerLabel={PURCHASE_LABELS.columns.partner}
          partnerCode={record.partner.code}
          partnerName={record.partner.name}
          supplierInvoiceNumber={record.supplierInvoiceNumber}
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
            {isDesktop ? (
              <Descriptions
                size="small"
                column={3}
                items={[
                  {
                    key: "status",
                    label: PURCHASE_LABELS.columns.status,
                    children: (
                      <Tag color={statusColor(record.status)}>
                        {purchaseStatusLabel(record.status)}
                      </Tag>
                    ),
                  },
                  {
                    key: "document",
                    label: PURCHASE_LABELS.columns.documentNumber,
                    children: <CodeText value={record.documentNumber} strong />,
                  },
                  {
                    key: "date",
                    label: PURCHASE_LABELS.columns.businessDate,
                    children: formatDateTime(record.businessDate),
                  },
                  {
                    key: "partner",
                    label: PURCHASE_LABELS.columns.partner,
                    children: (
                      <EntityCell
                        code={record.partner.code}
                        name={record.partner.name}
                      />
                    ),
                  },
                  {
                    key: "debt",
                    label: PURCHASE_LABELS.fields.partnerDebt,
                    children: (
                      <Space direction="vertical" size={0}>
                        <Text strong>
                          {formatMoney(record.partner.currentDebtBalance)}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {debtBalanceSignLabel(
                            record.partner.currentDebtBalance,
                          )}
                        </Text>
                      </Space>
                    ),
                  },
                  {
                    key: "itemCount",
                    label: PURCHASE_LABELS.fields.itemCount,
                    children: record.items.length,
                  },
                  {
                    key: "totalQuantity",
                    label: PURCHASE_LABELS.fields.totalQuantity,
                    children: formatQuantity(totalLineQuantity),
                  },
                  ...(projectedDebt != null
                    ? [
                        {
                          key: "projectedDebt",
                          label: PURCHASE_LABELS.fields.projectedDebt,
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
                    key: "invoice",
                    label: PURCHASE_LABELS.fields.supplierInvoiceNumber,
                    children: emptyDash(record.supplierInvoiceNumber),
                  },
                  {
                    key: "notes",
                    label: PURCHASE_LABELS.fields.notes,
                    children: emptyDash(record.notes),
                    span: 2,
                  },
                ]}
              />
            ) : (
              <div className="commercial-mobile-invoice-summary">
                <div className="commercial-mobile-invoice-primary">
                  <EntityCell
                    code={record.partner.code}
                    name={record.partner.name}
                  />
                  <Tag color={statusColor(record.status)}>
                    {purchaseStatusLabel(record.status)}
                  </Tag>
                </div>
                <div className="commercial-mobile-invoice-meta">
                  <span>
                    {phIcon(CalendarBlank, { size: ICON_SIZE.sm })}
                    {formatDateTime(record.businessDate)}
                  </span>
                  <span>
                    {phIcon(Package, { size: ICON_SIZE.sm })}
                    {record.items.length} sətir ·{" "}
                    {formatQuantity(totalLineQuantity)}
                  </span>
                </div>
                <div className="commercial-mobile-balance">
                  <Text type="secondary">
                    {PURCHASE_LABELS.fields.partnerDebt}
                  </Text>
                  <Text strong>
                    {formatMoney(record.partner.currentDebtBalance)}
                  </Text>
                </div>
                {record.supplierInvoiceNumber ? (
                  <Text className="commercial-mobile-invoice-note">
                    {PURCHASE_LABELS.fields.supplierInvoiceNumber}:{" "}
                    {record.supplierInvoiceNumber}
                  </Text>
                ) : null}
                {record.notes ? (
                  <Text className="commercial-mobile-invoice-note">
                    {record.notes}
                  </Text>
                ) : null}
              </div>
            )}
          </section>

          <section className="commercial-audit-card">
            <details className="commercial-audit-disclosure">
              <summary className="commercial-panel-heading">
                {phIcon(NoteBlank, { size: ICON_SIZE.md })}
                <span>{PURCHASE_LABELS.audit.title}</span>
              </summary>
              <Descriptions
                size="small"
                column={{ xs: 2, sm: 2, lg: 2 }}
                items={[
                  {
                    key: "createdBy",
                    label: PURCHASE_LABELS.audit.createdBy,
                    children: record.createdBy.fullName,
                  },
                  {
                    key: "createdAt",
                    label: PURCHASE_LABELS.columns.createdAt,
                    children: formatDateTime(record.createdAt),
                  },
                  {
                    key: "postedBy",
                    label: PURCHASE_LABELS.audit.postedBy,
                    children: emptyDash(record.postedBy?.fullName),
                  },
                  {
                    key: "postedAt",
                    label: PURCHASE_LABELS.audit.postedAt,
                    children: formatDateTime(record.postedAt),
                  },
                  {
                    key: "cancelledBy",
                    label: PURCHASE_LABELS.audit.cancelledBy,
                    children: emptyDash(record.cancelledBy?.fullName),
                  },
                  {
                    key: "cancelledAt",
                    label: PURCHASE_LABELS.audit.cancelledAt,
                    children: formatDateTime(record.cancelledAt),
                  },
                  {
                    key: "cancelReason",
                    label: PURCHASE_LABELS.audit.cancelReason,
                    children: emptyDash(record.cancelReason),
                    span: 2,
                  },
                ]}
              />
            </details>
          </section>
        </div>

        <section className="commercial-detail-section commercial-items-section">
          <Space className="commercial-section-heading" align="center">
            {phIcon(Package, { size: ICON_SIZE.md })}
            <Title level={5}>{PURCHASE_LABELS.fields.items}</Title>
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
              scroll={{ x: 1040 }}
            />
          ) : (
            <div className="commercial-record-list">
              {record.items.map((item) => (
                <article className="commercial-record-card" key={item.id}>
                  <div className="commercial-record-card-head">
                    <EntityCell
                      code={item.productCodeSnapshot}
                      name={item.productNameSnapshot}
                      secondary={item.unitNameSnapshot}
                    />
                    <Text strong>{formatMoney(item.lineTotal)}</Text>
                  </div>
                  <div className="commercial-mobile-line-math">
                    <strong>
                      {formatQuantity(item.quantity)} {item.unitNameSnapshot}
                    </strong>
                    <span>×</span>
                    <strong>{formatMoney(item.unitPrice)}</strong>
                    {Number(item.discountAmount) > 0 ? (
                      <Tag color="gold">
                        − {formatMoney(item.discountAmount)}
                      </Tag>
                    ) : null}
                  </div>
                  {item.notes ? (
                    <Text className="commercial-record-note" type="secondary">
                      {item.notes}
                    </Text>
                  ) : null}
                </article>
              ))}
            </div>
          )}
          <div className="ui-document-totals commercial-totals-card">
            <Space size="large" wrap>
              <Text type="secondary">
                {PURCHASE_LABELS.columns.subtotal}:{" "}
                {formatMoney(record.subtotalAmount)}
              </Text>
              <Text type="secondary">
                {PURCHASE_LABELS.columns.discount}:{" "}
                {formatMoney(record.discountAmount ?? 0)}
              </Text>
              <Text strong>
                {PURCHASE_LABELS.columns.total}:{" "}
                {formatMoney(record.totalAmount)}
              </Text>
            </Space>
          </div>
        </section>

        <div className="commercial-history-grid">
          <section className="commercial-detail-section">
            <Space className="commercial-section-heading" align="center">
              {phIcon(NoteBlank, { size: ICON_SIZE.md })}
              <Title level={5}>{PURCHASE_LABELS.history.debt}</Title>
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
                locale={{ emptyText: "Borc hərəkəti yoxdur." }}
                scroll={{ x: 700 }}
              />
            ) : (
              <div className="commercial-record-list commercial-history-list">
                {record.partnerDebtMovements.map((row) => (
                  <article className="commercial-record-card" key={row.id}>
                    <div className="commercial-record-card-head">
                      <Tag>{debtKindLabels[row.kind] ?? "Digər hərəkət"}</Tag>
                      <Text strong>{formatMoney(row.signedAmount)}</Text>
                    </div>
                    <div className="commercial-record-values">
                      <div>
                        <Text type="secondary">
                          {PURCHASE_LABELS.history.before}
                        </Text>
                        <strong>{formatMoney(row.balanceBefore)}</strong>
                      </div>
                      <div>
                        <Text type="secondary">
                          {PURCHASE_LABELS.history.after}
                        </Text>
                        <strong>{formatMoney(row.balanceAfter)}</strong>
                      </div>
                      <div>
                        <Text type="secondary">
                          {PURCHASE_LABELS.history.date}
                        </Text>
                        <strong>{formatDateTime(row.createdAt)}</strong>
                      </div>
                    </div>
                    <Text className="commercial-record-note" type="secondary">
                      {PURCHASE_LABELS.history.reason}: {emptyDash(row.reason)}
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
              <Title level={5}>{PURCHASE_LABELS.history.cash}</Title>
              <Tag>{record.cashTransactions?.length ?? 0}</Tag>
            </Space>
            <Text type="secondary">
              {PURCHASE_LABELS.history.cashCancelledHint}
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
              locale={{ emptyText: "Əlaqəli kassa əməliyyatı yoxdur." }}
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
                        ] ?? "Digər"}
                      </strong>
                    </div>
                    <div>
                      <Text type="secondary">
                        {PURCHASE_LABELS.columns.status}
                      </Text>
                      <strong>
                        {CASH_LABELS.statuses[
                          row.status as keyof typeof CASH_LABELS.statuses
                        ] ?? row.status}
                      </strong>
                    </div>
                    <div>
                      <Text type="secondary">
                        {PURCHASE_LABELS.history.date}
                      </Text>
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
            {phIcon(XCircle, { weight: "fill", size: ICON_SIZE.lg })}
            {PURCHASE_LABELS.cancel.title}
          </Space>
        }
        okText={PURCHASE_LABELS.actions.cancel}
        cancelText={PURCHASE_LABELS.actions.back}
        okButtonProps={{ danger: true, disabled: !cancelReason.trim() }}
        confirmLoading={cancelMutation.isPending}
        onCancel={() => {
          setCancelOpen(false);
          setCancelReason("");
        }}
        onOk={async () => {
          if (!cancelReason.trim()) return;
          try {
            await cancelMutation.mutateAsync({
              id: record.id,
              reason: cancelReason.trim(),
            });
            message.success(PURCHASE_LABELS.cancel.success);
            setCancelOpen(false);
            setCancelReason("");
          } catch (error) {
            message.error(mapApiError(error).userMessage);
          }
        }}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Text>{PURCHASE_LABELS.cancel.text}</Text>
          <div>
            <Text strong>{PURCHASE_LABELS.cancel.effectsTitle}</Text>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              {PURCHASE_LABELS.cancel.effects.map((effect) => (
                <li key={effect}>
                  <Text type="secondary">{effect}</Text>
                </li>
              ))}
            </ul>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {PURCHASE_LABELS.cancel.insufficientQuantityHint}
            </Text>
          </div>
          <div>
            <Text strong>{PURCHASE_LABELS.cancel.reason}</Text>
            <Input.TextArea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder={PURCHASE_LABELS.cancel.reasonPlaceholder}
              rows={3}
              maxLength={1000}
              showCount
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      <PurchasePostConfirmModal
        open={postOpen}
        confirmLoading={postMutation.isPending}
        documentTotal={record.totalAmount}
        partnerDebtBalance={record.partner.currentDebtBalance}
        onCancel={() => setPostOpen(false)}
        onConfirm={async (payload) => {
          try {
            await postMutation.mutateAsync({ id: record.id, input: payload });
            message.success(PURCHASE_LABELS.post.success);
            setPostOpen(false);
          } catch (error) {
            message.error(mapApiError(error).userMessage);
            throw error;
          }
        }}
      />

      <PurchaseFormModal
        open={editOpen}
        purchaseId={record.id}
        onCancel={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          void purchase.refetch();
        }}
      />
    </div>
  );
}
