import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
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
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  NoteBlank,
  Package,
  PencilSimple,
  Scales,
  ShoppingCart,
  Trash,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import { mapApiError } from '../../../api/map-api-error';
import { debtBalanceSignLabel } from '../../../shared/money/debt-balance-label';
import { formatMoney } from '../../../shared/money/format-money';
import {
  emptyDash,
  formatDate,
  formatDateTime,
  formatQuantity,
} from '../../../shared/ui/format';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import {
  CodeText,
  EntityCell,
  MoneyCell,
} from '../../../shared/ui/table-cells';
import { PageHeader } from '../../master-data/ui/page-header';
import type {
  PurchaseDebtMovement,
  PurchaseItem,
  PurchaseQuantityHistory,
  PurchaseStatus,
} from '../api/purchases.api';
import {
  useCancelPurchase,
  usePostPurchase,
  usePurchase,
  useRemovePurchase,
} from '../api/purchases.hooks';
import { PURCHASE_LABELS, purchaseStatusLabel } from '../ui/labels';
import { PurchaseFormModal } from '../ui/purchase-form-modal';

const { Text, Title } = Typography;

function statusColor(status: PurchaseStatus) {
  return status === 'POSTED' ? 'success' : status === 'CANCELLED' ? 'error' : 'warning';
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

export function PurchaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const purchase = usePurchase(id);
  const postMutation = usePostPurchase();
  const removeMutation = useRemovePurchase();
  const cancelMutation = useCancelPurchase();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  if (purchase.isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin tip={PURCHASE_LABELS.messages.loading} />
      </div>
    );
  }
  if (purchase.isError || !purchase.data) {
    return (
      <Alert
        type="error"
        showIcon
        icon={phIcon(WarningCircle, { weight: 'fill' })}
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

  function confirmPost() {
    Modal.confirm({
      title: PURCHASE_LABELS.post.title,
      content: PURCHASE_LABELS.post.text,
      okText: PURCHASE_LABELS.actions.post,
      cancelText: PURCHASE_LABELS.actions.back,
      icon: phIcon(CheckCircle, { size: ICON_SIZE.xl, weight: 'fill' }),
      onOk: async () => {
        try {
          await postMutation.mutateAsync(record.id);
          message.success(PURCHASE_LABELS.post.success);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  function confirmRemove() {
    Modal.confirm({
      title: PURCHASE_LABELS.remove.title,
      content: PURCHASE_LABELS.remove.text,
      okText: PURCHASE_LABELS.actions.remove,
      cancelText: PURCHASE_LABELS.actions.back,
      okButtonProps: { danger: true },
      icon: phIcon(WarningCircle, { size: ICON_SIZE.xl, weight: 'fill' }),
      onOk: async () => {
        try {
          await removeMutation.mutateAsync(record.id);
          message.success(PURCHASE_LABELS.remove.success);
          navigate('/purchases');
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  const itemColumns: ColumnsType<PurchaseItem> = [
    {
      title: '#',
      key: 'index',
      width: 48,
      render: (_value, _row, index) => (
        <Text type="secondary">{index + 1}</Text>
      ),
    },
    {
      title: PURCHASE_LABELS.fields.product,
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
      title: PURCHASE_LABELS.fields.quantity,
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      align: 'right',
      render: (value: string) => formatQuantity(value),
    },
    {
      title: PURCHASE_LABELS.fields.unitPrice,
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 130,
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: PURCHASE_LABELS.fields.lineDiscount,
      dataIndex: 'discountAmount',
      key: 'discount',
      width: 120,
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: PURCHASE_LABELS.fields.lineTotal,
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      width: 130,
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
    {
      title: PURCHASE_LABELS.fields.lineNotes,
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (value: string | null) => emptyDash(value),
    },
  ];

  const quantityColumns: ColumnsType<PurchaseQuantityHistory> = [
    {
      title: 'Hərəkət',
      dataIndex: 'kind',
      key: 'kind',
      render: (value: string) => (
        <Tag>{quantityKindLabels[value] ?? 'Digər hərəkət'}</Tag>
      ),
    },
    {
      title: PURCHASE_LABELS.history.change,
      dataIndex: 'quantityChange',
      key: 'change',
      align: 'right',
      render: (value: string) => formatQuantity(value),
    },
    {
      title: PURCHASE_LABELS.history.before,
      dataIndex: 'quantityBefore',
      key: 'before',
      align: 'right',
      render: (value: string) => formatQuantity(value),
    },
    {
      title: PURCHASE_LABELS.history.after,
      dataIndex: 'quantityAfter',
      key: 'after',
      align: 'right',
      render: (value: string) => formatQuantity(value),
    },
    {
      title: PURCHASE_LABELS.history.reason,
      dataIndex: 'reason',
      key: 'reason',
      render: (value: string | null) => emptyDash(value),
    },
    {
      title: PURCHASE_LABELS.history.date,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const debtColumns: ColumnsType<PurchaseDebtMovement> = [
    {
      title: 'Hərəkət',
      dataIndex: 'kind',
      key: 'kind',
      render: (value: string) => (
        <Tag>{debtKindLabels[value] ?? 'Digər hərəkət'}</Tag>
      ),
    },
    {
      title: PURCHASE_LABELS.history.signedAmount,
      dataIndex: 'signedAmount',
      key: 'signedAmount',
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
    {
      title: PURCHASE_LABELS.history.before,
      dataIndex: 'balanceBefore',
      key: 'before',
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: PURCHASE_LABELS.history.after,
      dataIndex: 'balanceAfter',
      key: 'after',
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: PURCHASE_LABELS.history.reason,
      dataIndex: 'reason',
      key: 'reason',
      render: (value: string | null) => emptyDash(value),
    },
    {
      title: PURCHASE_LABELS.history.date,
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (value: string) => formatDateTime(value),
    },
  ];

  return (
    <div>
      <PageHeader
        title={record.documentNumber}
        description={PURCHASE_LABELS.detail}
        icon={phIcon(ShoppingCart, { size: ICON_SIZE.xl, weight: 'duotone' })}
        extra={
          <Space wrap>
            <Button
              icon={phIcon(ArrowLeft, { size: ICON_SIZE.md })}
              onClick={() => navigate('/purchases')}
            >
              {PURCHASE_LABELS.actions.back}
            </Button>
            {record.status === 'DRAFT' ? (
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
            {record.status === 'POSTED' ? (
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

      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={[
            {
              key: 'status',
              label: PURCHASE_LABELS.columns.status,
              children: (
                <Tag color={statusColor(record.status)}>
                  {purchaseStatusLabel(record.status)}
                </Tag>
              ),
            },
            {
              key: 'document',
              label: PURCHASE_LABELS.columns.documentNumber,
              children: <CodeText value={record.documentNumber} strong />,
            },
            {
              key: 'date',
              label: PURCHASE_LABELS.columns.businessDate,
              children: formatDate(record.businessDate),
            },
            {
              key: 'partner',
              label: PURCHASE_LABELS.columns.partner,
              children: (
                <EntityCell
                  code={record.partner.code}
                  name={record.partner.name}
                />
              ),
            },
            {
              key: 'debt',
              label: 'Cari borc qalığı',
              children: (
                <Space direction="vertical" size={0}>
                  <Text strong>
                    {formatMoney(record.partner.currentDebtBalance)}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {debtBalanceSignLabel(record.partner.currentDebtBalance)}
                  </Text>
                </Space>
              ),
            },
            {
              key: 'invoice',
              label: PURCHASE_LABELS.fields.supplierInvoiceNumber,
              children: emptyDash(record.supplierInvoiceNumber),
            },
            {
              key: 'notes',
              label: PURCHASE_LABELS.fields.notes,
              children: emptyDash(record.notes),
              span: 2,
            },
          ]}
        />
      </Card>

      <Space align="center" style={{ marginBottom: 8 }}>
        {phIcon(Package, { size: ICON_SIZE.md })}
        <Title level={5} style={{ margin: 0 }}>
          {PURCHASE_LABELS.fields.items}
        </Title>
      </Space>
      <Table
        rowKey="id"
        size="middle"
        columns={itemColumns}
        dataSource={record.items}
        pagination={false}
        scroll={{ x: 920 }}
      />
      <Card size="small" style={{ marginTop: 12, marginBottom: 20 }}>
        <Space
          style={{ width: '100%', justifyContent: 'flex-end' }}
          size="large"
          wrap
        >
          <Text type="secondary">
            {PURCHASE_LABELS.columns.subtotal}:{' '}
            {formatMoney(record.subtotalAmount)}
          </Text>
          <Text type="secondary">
            {PURCHASE_LABELS.columns.discount}:{' '}
            {formatMoney(record.discountAmount ?? 0)}
          </Text>
          <Text strong style={{ fontSize: 16 }}>
            {PURCHASE_LABELS.columns.total}: {formatMoney(record.totalAmount)}
          </Text>
        </Space>
      </Card>

      <Space align="center" style={{ marginBottom: 8 }}>
        {phIcon(FileText, { size: ICON_SIZE.md })}
        <Title level={5} style={{ margin: 0 }}>
          {PURCHASE_LABELS.audit.title}
        </Title>
      </Space>
      <Card size="small" style={{ marginBottom: 20 }}>
        <Descriptions
          size="small"
          column={{ xs: 1, md: 2 }}
          items={[
            {
              key: 'createdBy',
              label: PURCHASE_LABELS.audit.createdBy,
              children: record.createdBy.fullName,
            },
            {
              key: 'createdAt',
              label: PURCHASE_LABELS.columns.createdAt,
              children: formatDateTime(record.createdAt),
            },
            {
              key: 'postedBy',
              label: PURCHASE_LABELS.audit.postedBy,
              children: emptyDash(record.postedBy?.fullName),
            },
            {
              key: 'postedAt',
              label: PURCHASE_LABELS.audit.postedAt,
              children: formatDateTime(record.postedAt),
            },
            {
              key: 'cancelledBy',
              label: PURCHASE_LABELS.audit.cancelledBy,
              children: emptyDash(record.cancelledBy?.fullName),
            },
            {
              key: 'cancelledAt',
              label: PURCHASE_LABELS.audit.cancelledAt,
              children: formatDateTime(record.cancelledAt),
            },
            {
              key: 'cancelReason',
              label: PURCHASE_LABELS.audit.cancelReason,
              children: emptyDash(record.cancelReason),
              span: 2,
            },
          ]}
        />
      </Card>

      <Space align="center" style={{ marginBottom: 8 }}>
        {phIcon(Scales, { size: ICON_SIZE.md })}
        <Title level={5} style={{ margin: 0 }}>
          {PURCHASE_LABELS.history.quantity}
        </Title>
      </Space>
      <Table
        rowKey="id"
        size="small"
        columns={quantityColumns}
        dataSource={record.productQuantityHistory}
        pagination={false}
        locale={{ emptyText: 'Miqdar hərəkəti yoxdur.' }}
        scroll={{ x: 700 }}
        style={{ marginBottom: 20 }}
      />

      <Space align="center" style={{ marginBottom: 8 }}>
        {phIcon(NoteBlank, { size: ICON_SIZE.md })}
        <Title level={5} style={{ margin: 0 }}>
          {PURCHASE_LABELS.history.debt}
        </Title>
      </Space>
      <Table
        rowKey="id"
        size="small"
        columns={debtColumns}
        dataSource={record.partnerDebtMovements}
        pagination={false}
        locale={{ emptyText: 'Borc hərəkəti yoxdur.' }}
        scroll={{ x: 800 }}
      />

      <Modal
        open={cancelOpen}
        title={
          <Space>
            {phIcon(XCircle, { weight: 'fill', size: ICON_SIZE.lg })}
            {PURCHASE_LABELS.cancel.title}
          </Space>
        }
        okText={PURCHASE_LABELS.actions.cancel}
        cancelText={PURCHASE_LABELS.actions.back}
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
            message.success(PURCHASE_LABELS.cancel.success);
            setCancelOpen(false);
            setCancelReason('');
          } catch (error) {
            message.error(mapApiError(error).userMessage);
          }
        }}
      >
        <Text>{PURCHASE_LABELS.cancel.text}</Text>
        <div style={{ marginTop: 16 }}>
          <Text strong>{PURCHASE_LABELS.cancel.reason}</Text>
          <Input.TextArea
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            placeholder={PURCHASE_LABELS.cancel.reasonPlaceholder}
            rows={3}
            maxLength={1000}
            showCount
          />
        </div>
      </Modal>

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
