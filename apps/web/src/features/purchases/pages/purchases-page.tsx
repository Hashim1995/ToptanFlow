import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  DatePicker,
  Dropdown,
  Grid,
  Input,
  Modal,
  Pagination,
  Popover,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { MenuProps, TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import {
  DATE_DISPLAY_FORMAT,
  dateOnlyPickerToApi,
} from '../../../shared/datetime';
import { useNavigate } from 'react-router-dom';
import {
  ArrowCounterClockwise,
  CalendarBlank,
  CheckCircle,
  Eye,
  Funnel,
  Package,
  PencilSimple,
  Plus,
  ShoppingCart,
  Trash,
  User,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import { mapApiError } from '../../../api/map-api-error';
import { formatMoney } from '../../../shared/money/format-money';
import { formatDateTime } from '../../../shared/ui/format';
import { phIcon, ICON_SIZE } from '../../../shared/ui/ph-icon';
import {
  CodeText,
  EntityCell,
  MoneyCell,
} from '../../../shared/ui/table-cells';
import { useBusinessPartnersList } from '../../master-data/api/business-partners.hooks';
import { useProductsList } from '../../master-data/api/products.hooks';
import { DecimalInput } from '../../master-data/ui/decimal-input';
import {
  FilterBar,
  FilterField,
} from '../../master-data/ui/list-toolbar';
import { PageHeader } from '../../master-data/ui/page-header';
import type {
  PurchaseListItem,
  PurchaseSortBy,
  PurchaseStatus,
} from '../api/purchases.api';
import {
  useCancelPurchase,
  usePostPurchase,
  usePurchase,
  usePurchasesList,
  useRemovePurchase,
} from '../api/purchases.hooks';
import { PURCHASE_LABELS, purchaseStatusLabel } from '../ui/labels';
import { PurchaseFormModal } from '../ui/purchase-form-modal';
import { PurchasePostConfirmModal } from '../ui/purchase-post-confirm-modal';

const { Text } = Typography;

function partnerName(record: PurchaseListItem) {
  return record.partnerName ?? record.partner?.name ?? '—';
}

function partnerCode(record: PurchaseListItem) {
  return record.partnerCode ?? record.partner?.code ?? '';
}

function createdByName(record: PurchaseListItem) {
  return record.createdByName ?? record.createdBy?.fullName ?? '—';
}

function statusColor(status: PurchaseStatus) {
  return status === 'POSTED' ? 'success' : status === 'CANCELLED' ? 'error' : 'warning';
}

function StatusBadge({ status }: { status: PurchaseStatus }) {
  return (
    <Tag color={statusColor(status)} style={{ marginInlineEnd: 0 }}>
      {purchaseStatusLabel(status)}
    </Tag>
  );
}

export function PurchasesPage() {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [documentInput, setDocumentInput] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [partnerId, setPartnerId] = useState<string>();
  const [status, setStatus] = useState<PurchaseStatus>();
  const [dateRange, setDateRange] = useState<[string, string]>();
  const [productId, setProductId] = useState<string>();
  const [minTotal, setMinTotal] = useState('');
  const [maxTotal, setMaxTotal] = useState('');
  const [sortBy, setSortBy] = useState<PurchaseSortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [cancelTarget, setCancelTarget] = useState<PurchaseListItem>();
  const [cancelReason, setCancelReason] = useState('');
  const [postTarget, setPostTarget] = useState<PurchaseListItem>();
  const [formMode, setFormMode] = useState<
    { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; purchaseId: string }
  >({ kind: 'closed' });

  const query = useMemo(
    () => ({
      page,
      pageSize,
      documentNumber: documentNumber || undefined,
      partnerId,
      status,
      businessDateFrom: dateRange?.[0],
      businessDateTo: dateRange?.[1],
      productId,
      minTotal: minTotal || undefined,
      maxTotal: maxTotal || undefined,
      sortBy,
      sortOrder,
    }),
    [
      page,
      pageSize,
      documentNumber,
      partnerId,
      status,
      dateRange,
      productId,
      minTotal,
      maxTotal,
      sortBy,
      sortOrder,
    ],
  );
  const list = usePurchasesList(query);
  const partners = useBusinessPartnersList({
    pageSize: 100,
    isSupplier: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const products = useProductsList({
    pageSize: 100,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const postMutation = usePostPurchase();
  const removeMutation = useRemovePurchase();
  const cancelMutation = useCancelPurchase();
  const postTargetDetail = usePurchase(postTarget?.id);

  const partnerOptions = (partners.data?.data ?? [])
    .filter((partner) => partner.isSupplier)
    .map((partner) => ({
      value: partner.id,
      label: `${partner.code} — ${partner.name}`,
    }));
  const productOptions = (products.data?.data ?? []).map((product) => ({
    value: product.id,
    label: `${product.code} — ${product.name}`,
  }));

  const activeFilterCount = [
    documentNumber,
    partnerId,
    status,
    dateRange,
    productId,
    minTotal,
    maxTotal,
  ].filter(Boolean).length;

  function confirmPost(record: PurchaseListItem) {
    setPostTarget(record);
  }

  function confirmRemove(record: PurchaseListItem) {
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
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  function actionMenu(record: PurchaseListItem): MenuProps['items'] {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        icon: phIcon(Eye, { size: ICON_SIZE.sm }),
        label: PURCHASE_LABELS.actions.view,
        onClick: () => navigate(`/purchases/${record.id}`),
      },
    ];
    if (record.status === 'DRAFT') {
      items.push(
        {
          key: 'edit',
          icon: phIcon(PencilSimple, { size: ICON_SIZE.sm }),
          label: PURCHASE_LABELS.actions.edit,
          onClick: () =>
            setFormMode({ kind: 'edit', purchaseId: record.id }),
        },
        {
          key: 'post',
          icon: phIcon(CheckCircle, { size: ICON_SIZE.sm }),
          label: PURCHASE_LABELS.actions.post,
          onClick: () => confirmPost(record),
        },
        { type: 'divider' },
        {
          key: 'remove',
          danger: true,
          icon: phIcon(Trash, { size: ICON_SIZE.sm }),
          label: PURCHASE_LABELS.actions.remove,
          onClick: () => confirmRemove(record),
        },
      );
    }
    if (record.status === 'POSTED') {
      items.push({
        key: 'cancel',
        danger: true,
        icon: phIcon(XCircle, { size: ICON_SIZE.sm }),
        label: PURCHASE_LABELS.actions.cancel,
        onClick: () => setCancelTarget(record),
      });
    }
    return items;
  }

  function actions(record: PurchaseListItem) {
    return (
      <Space size={4} wrap>
        <Tooltip title={PURCHASE_LABELS.actions.view}>
          <Button
            type="text"
            size="small"
            icon={phIcon(Eye, { size: ICON_SIZE.sm })}
            aria-label={PURCHASE_LABELS.actions.view}
            onClick={() => navigate(`/purchases/${record.id}`)}
          />
        </Tooltip>
        {record.status === 'DRAFT' ? (
          <>
            <Tooltip title={PURCHASE_LABELS.actions.edit}>
              <Button
                type="text"
                size="small"
                icon={phIcon(PencilSimple, { size: ICON_SIZE.sm })}
                aria-label={PURCHASE_LABELS.actions.edit}
                onClick={() =>
                  setFormMode({ kind: 'edit', purchaseId: record.id })
                }
              />
            </Tooltip>
            <Tooltip title={PURCHASE_LABELS.actions.post}>
              <Button
                type="primary"
                ghost
                size="small"
                icon={phIcon(CheckCircle, { size: ICON_SIZE.sm })}
                aria-label={PURCHASE_LABELS.actions.post}
                onClick={() => confirmPost(record)}
              />
            </Tooltip>
          </>
        ) : null}
        <Dropdown menu={{ items: actionMenu(record) }} trigger={['click']}>
          <Button type="text" size="small">
            •••
          </Button>
        </Dropdown>
      </Space>
    );
  }

  const columns: ColumnsType<PurchaseListItem> = [
    {
      title: PURCHASE_LABELS.columns.status,
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: PurchaseStatus) => <StatusBadge status={value} />,
    },
    {
      title: PURCHASE_LABELS.columns.documentNumber,
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      width: 140,
      sorter: true,
      render: (value: string) => <CodeText value={value} strong />,
    },
    {
      title: PURCHASE_LABELS.columns.businessDate,
      dataIndex: 'businessDate',
      key: 'businessDate',
      width: 130,
      sorter: true,
      render: (value: string) => (
        <Space size={6}>
          {phIcon(CalendarBlank, { size: ICON_SIZE.sm })}
          <Text>{formatDateTime(value)}</Text>
        </Space>
      ),
    },
    {
      title: PURCHASE_LABELS.columns.partner,
      key: 'partner',
      ellipsis: true,
      render: (_, record) => (
        <EntityCell code={partnerCode(record)} name={partnerName(record)} />
      ),
    },
    {
      title: PURCHASE_LABELS.columns.itemCount,
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 100,
      align: 'center',
      render: (value: number) => (
        <Badge
          count={value}
          showZero
          color="#1677ff"
          overflowCount={999}
          style={{ backgroundColor: '#1677ff' }}
        />
      ),
    },
    {
      title: PURCHASE_LABELS.columns.total,
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 140,
      sorter: true,
      align: 'right',
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
    {
      title: PURCHASE_LABELS.columns.createdBy,
      key: 'createdBy',
      width: 140,
      ellipsis: true,
      render: (_, record) => (
        <Space size={6}>
          {phIcon(User, { size: ICON_SIZE.sm })}
          <Text ellipsis style={{ maxWidth: 110 }}>
            {createdByName(record)}
          </Text>
        </Space>
      ),
    },
    {
      title: PURCHASE_LABELS.columns.actions,
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => actions(record),
    },
  ];

  const handleTableChange: TableProps<PurchaseListItem>['onChange'] = (
    _pagination,
    _filters,
    sorter,
  ) => {
    if (
      !Array.isArray(sorter) &&
      typeof sorter.field === 'string' &&
      sorter.order
    ) {
      setSortBy(sorter.field as PurchaseSortBy);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
      setPage(1);
    }
  };

  return (
    <div>
      <PageHeader
        title={PURCHASE_LABELS.title}
        description={PURCHASE_LABELS.description}
        icon={phIcon(ShoppingCart, { size: ICON_SIZE.xl, weight: 'duotone' })}
        extra={
          <Button
            type="primary"
            icon={phIcon(Plus, { size: ICON_SIZE.md, weight: 'bold' })}
            onClick={() => setFormMode({ kind: 'create' })}
          >
            {PURCHASE_LABELS.create}
          </Button>
        }
      />

      <Card
        size="small"
        style={{ marginBottom: 16 }}
        title={
          <Space size={8}>
            {phIcon(Funnel, { size: ICON_SIZE.sm })}
            <span>Filtrlər</span>
            {activeFilterCount > 0 ? (
              <Badge count={activeFilterCount} color="#1677ff" />
            ) : null}
          </Space>
        }
      >
        <FilterBar>
          <FilterField label={PURCHASE_LABELS.filters.documentNumber}>
            <Input.Search
              allowClear
              value={documentInput}
              placeholder={PURCHASE_LABELS.filters.documentNumberPlaceholder}
              onChange={(event) => setDocumentInput(event.target.value)}
              onSearch={(value) => {
                setDocumentNumber(value.trim());
                setPage(1);
              }}
              style={{ width: 220 }}
            />
          </FilterField>
          <FilterField label={PURCHASE_LABELS.filters.partner}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={partnerId}
              placeholder={PURCHASE_LABELS.fields.partnerPlaceholder}
              options={partnerOptions}
              onChange={(value) => {
                setPartnerId(value);
                setPage(1);
              }}
              style={{ width: 220 }}
            />
          </FilterField>
          <FilterField label={PURCHASE_LABELS.filters.status}>
            <Select
              allowClear
              value={status}
              placeholder={PURCHASE_LABELS.filters.all}
              options={(
                Object.keys(PURCHASE_LABELS.statuses) as PurchaseStatus[]
              ).map((value) => ({
                value,
                label: purchaseStatusLabel(value),
              }))}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              style={{ width: 160 }}
            />
          </FilterField>
          <FilterField label={PURCHASE_LABELS.filters.dateRange}>
            <DatePicker.RangePicker
              format={DATE_DISPLAY_FORMAT}
              onChange={(values: null | [Dayjs | null, Dayjs | null]) => {
                setDateRange(
                  values?.[0] && values[1]
                    ? [
                        dateOnlyPickerToApi(values[0]),
                        dateOnlyPickerToApi(values[1]),
                      ]
                    : undefined,
                );
                setPage(1);
              }}
            />
          </FilterField>
          <FilterField label={PURCHASE_LABELS.filters.product}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={productId}
              placeholder={PURCHASE_LABELS.fields.productPlaceholder}
              options={productOptions}
              onChange={(value) => {
                setProductId(value);
                setPage(1);
              }}
              style={{ width: 220 }}
            />
          </FilterField>
          <FilterField label={PURCHASE_LABELS.filters.minTotal}>
            <DecimalInput
              value={minTotal}
              onChange={(value) => {
                setMinTotal(value);
                setPage(1);
              }}
            />
          </FilterField>
          <FilterField label={PURCHASE_LABELS.filters.maxTotal}>
            <DecimalInput
              value={maxTotal}
              onChange={(value) => {
                setMaxTotal(value);
                setPage(1);
              }}
            />
          </FilterField>
        </FilterBar>
      </Card>

      {list.isError ? (
        <Alert
          type="error"
          showIcon
          icon={phIcon(WarningCircle, { weight: 'fill' })}
          message={mapApiError(list.error).userMessage}
          action={
            <Button
              size="small"
              icon={phIcon(ArrowCounterClockwise, { size: ICON_SIZE.sm })}
              onClick={() => void list.refetch()}
            >
              {PURCHASE_LABELS.actions.retry}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {isDesktop ? (
        <Table
          rowKey="id"
          size="middle"
          loading={list.isLoading}
          dataSource={list.data?.data ?? []}
          columns={columns}
          pagination={false}
          locale={{ emptyText: PURCHASE_LABELS.messages.empty }}
          scroll={{ x: 1180 }}
          onChange={handleTableChange}
        />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {list.isLoading ? (
            <Text>{PURCHASE_LABELS.messages.loading}</Text>
          ) : null}
          {!list.isLoading && !list.data?.data.length ? (
            <Text type="secondary">{PURCHASE_LABELS.messages.empty}</Text>
          ) : null}
          {(list.data?.data ?? []).map((record) => (
            <Card
              key={record.id}
              size="small"
              title={
                <Space>
                  <CodeText value={record.documentNumber} strong />
                  <StatusBadge status={record.status} />
                </Space>
              }
              extra={actions(record)}
            >
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <EntityCell
                  code={partnerCode(record)}
                  name={partnerName(record)}
                />
                <Space wrap size={[12, 4]}>
                  <Text type="secondary">
                    {phIcon(CalendarBlank, { size: 12 })} {formatDateTime(record.businessDate)}
                  </Text>
                  <Popover content={`${record.itemCount} sətir`}>
                    <Space size={4}>
                      {phIcon(Package, { size: 12 })}
                      <Badge count={record.itemCount} showZero color="#1677ff" />
                    </Space>
                  </Popover>
                </Space>
                <Text strong>{formatMoney(record.totalAmount)}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {PURCHASE_LABELS.columns.createdBy}: {createdByName(record)}
                </Text>
              </Space>
            </Card>
          ))}
        </Space>
      )}

      <Pagination
        current={page}
        pageSize={pageSize}
        total={list.data?.meta.total ?? 0}
        showSizeChanger
        showTotal={(total) => `Cəmi ${total}`}
        style={{ marginTop: 16, textAlign: 'right' }}
        onChange={(nextPage, nextPageSize) => {
          setPage(nextPage);
          setPageSize(nextPageSize);
        }}
      />

      <Modal
        open={Boolean(cancelTarget)}
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
          setCancelTarget(undefined);
          setCancelReason('');
        }}
        onOk={async () => {
          if (!cancelTarget || !cancelReason.trim()) return;
          try {
            await cancelMutation.mutateAsync({
              id: cancelTarget.id,
              reason: cancelReason.trim(),
            });
            message.success(PURCHASE_LABELS.cancel.success);
            setCancelTarget(undefined);
            setCancelReason('');
          } catch (error) {
            message.error(mapApiError(error).userMessage);
          }
        }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text>{PURCHASE_LABELS.cancel.text}</Text>
          <div>
            <Text strong>{PURCHASE_LABELS.cancel.effectsTitle}</Text>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
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
        open={Boolean(postTarget)}
        confirmLoading={
          postMutation.isPending ||
          (Boolean(postTarget) && postTargetDetail.isLoading)
        }
        documentTotal={
          postTargetDetail.data?.totalAmount ?? postTarget?.totalAmount
        }
        partnerDebtBalance={
          postTargetDetail.data?.partner.currentDebtBalance ??
          postTarget?.partner?.currentDebtBalance
        }
        onCancel={() => setPostTarget(undefined)}
        onConfirm={async (payload) => {
          if (!postTarget) return;
          try {
            await postMutation.mutateAsync({
              id: postTarget.id,
              input: payload,
            });
            message.success(PURCHASE_LABELS.post.success);
            setPostTarget(undefined);
          } catch (error) {
            message.error(mapApiError(error).userMessage);
            throw error;
          }
        }}
      />

      <PurchaseFormModal
        key={
          formMode.kind === 'edit'
            ? `edit-${formMode.purchaseId}`
            : formMode.kind
        }
        open={formMode.kind !== 'closed'}
        purchaseId={
          formMode.kind === 'edit' ? formMode.purchaseId : undefined
        }
        onCancel={() => setFormMode({ kind: 'closed' })}
        onSaved={() => setFormMode({ kind: 'closed' })}
      />
    </div>
  );
}
