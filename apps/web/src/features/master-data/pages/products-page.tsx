import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Grid,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { mapApiError } from '../../../api/map-api-error';
import type { Product, ProductType } from '../api/products.api';
import {
  useCreateProduct,
  useDeactivateProduct,
  useProductsList,
  useUpdateProduct,
} from '../api/products.hooks';
import type { ProductFormValues } from '../forms/product.schemas';
import { ActiveStatusTag } from '../ui/active-status-tag';
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from '../ui/active-filter';
import { MASTER_DATA_LABELS, productTypeLabel } from '../ui/labels';
import { ActiveStatusFilter, ListToolbar } from '../ui/list-toolbar';
import { ProductFormModal } from '../ui/product-form-modal';

const { Title, Text } = Typography;

type FormMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; product: Product };

type TypeFilterValue = 'all' | ProductType;

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export function ProductsPage() {
  const labels = MASTER_DATA_LABELS.products;
  const common = MASTER_DATA_LABELS.common;
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' });
  const [formError, setFormError] = useState<string | undefined>();

  const listQuery = useMemo(
    () => ({
      page,
      pageSize,
      search: search || undefined,
      isActive: activeFilterToIsActive(activeFilter),
      type: typeFilter === 'all' ? undefined : typeFilter,
      sortBy: 'code',
      sortOrder: 'asc' as const,
    }),
    [page, pageSize, search, activeFilter, typeFilter],
  );

  const list = useProductsList(listQuery);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deactivateMutation = useDeactivateProduct();
  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<Product> = [
    { title: common.code, dataIndex: 'code', key: 'code', width: 110 },
    { title: common.name, dataIndex: 'name', key: 'name' },
    {
      title: labels.type,
      dataIndex: 'type',
      key: 'type',
      render: (type: ProductType) => productTypeLabel(type),
    },
    {
      title: labels.category,
      dataIndex: 'category',
      key: 'category',
      render: (value: string | null) => value ?? '—',
    },
    {
      title: labels.unit,
      key: 'unit',
      render: (_, record) => `${record.unit.code} — ${record.unit.name}`,
    },
    {
      title: labels.standardSalePrice,
      dataIndex: 'standardSalePrice',
      key: 'standardSalePrice',
      render: (value: string | null) => value ?? '—',
    },
    {
      title: common.status,
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => <ActiveStatusTag isActive={isActive} />,
    },
    {
      title: common.actions,
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Button type="link" onClick={() => openEdit(record)}>
            {common.edit}
          </Button>
          {record.isActive ? (
            <Button type="link" danger onClick={() => confirmDeactivate(record)}>
              {common.deactivate}
            </Button>
          ) : null}
        </Space>
      ),
    },
  ];

  function openCreate() {
    setFormError(undefined);
    setFormMode({ kind: 'create' });
  }

  function openEdit(product: Product) {
    setFormError(undefined);
    setFormMode({ kind: 'edit', product });
  }

  function closeForm() {
    setFormMode({ kind: 'closed' });
    setFormError(undefined);
  }

  async function handleSubmit(values: ProductFormValues) {
    setFormError(undefined);

    try {
      if (formMode.kind === 'create') {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          type: values.type,
          category: emptyToNull(values.category ?? ''),
          unitId: values.unitId,
          standardSalePrice: emptyToUndefined(values.standardSalePrice),
          latestPurchasePrice: emptyToUndefined(values.latestPurchasePrice),
          criticalStockThreshold: emptyToUndefined(
            values.criticalStockThreshold,
          ),
        });
        message.success(common.createSuccess);
      } else if (formMode.kind === 'edit') {
        await updateMutation.mutateAsync({
          id: formMode.product.id,
          input: {
            name: values.name.trim(),
            type: values.type,
            category: emptyToNull(values.category ?? ''),
            unitId: values.unitId,
            standardSalePrice: emptyToNull(values.standardSalePrice),
            latestPurchasePrice: emptyToNull(values.latestPurchasePrice),
            criticalStockThreshold: emptyToNull(values.criticalStockThreshold),
          },
        });
        message.success(common.updateSuccess);
      }
      closeForm();
    } catch (error) {
      setFormError(mapApiError(error).userMessage);
    }
  }

  function confirmDeactivate(product: Product) {
    Modal.confirm({
      title: labels.deactivateConfirm,
      okText: common.confirm,
      cancelText: common.cancel,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateMutation.mutateAsync(product.id);
          message.success(common.deactivateSuccess);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  const editInitialValues: ProductFormValues | undefined =
    formMode.kind === 'edit'
      ? {
          name: formMode.product.name,
          type: formMode.product.type,
          category: formMode.product.category ?? '',
          unitId: formMode.product.unitId,
          standardSalePrice: formMode.product.standardSalePrice ?? '',
          latestPurchasePrice: formMode.product.latestPurchasePrice ?? '',
          criticalStockThreshold:
            formMode.product.criticalStockThreshold ?? '',
        }
      : undefined;

  const fallbackUnitOption =
    formMode.kind === 'edit'
      ? {
          value: formMode.product.unitId,
          label: `${formMode.product.unit.code} — ${formMode.product.unit.name}`,
        }
      : undefined;

  const typeFilterOptions = [
    { value: 'all' as const, label: common.all },
    ...(Object.keys(labels.types) as ProductType[]).map((type) => ({
      value: type,
      label: productTypeLabel(type),
    })),
  ];

  return (
    <div>
      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
        wrap
      >
        <Title level={3} style={{ margin: 0 }}>
          {labels.title}
        </Title>
        <Button type="primary" onClick={openCreate}>
          {labels.create}
        </Button>
      </Space>

      <ListToolbar>
        <Input.Search
          allowClear
          placeholder={common.search}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onSearch={(value) => {
            setSearch(value.trim());
            setPage(1);
          }}
          style={{ maxWidth: 280 }}
        />
        <ActiveStatusFilter
          value={activeFilter}
          onChange={(value) => {
            setActiveFilter(value);
            setPage(1);
          }}
        />
        <Select
          value={typeFilter}
          onChange={(value: TypeFilterValue) => {
            setTypeFilter(value);
            setPage(1);
          }}
          style={{ minWidth: 180 }}
          aria-label={labels.filterType}
          options={typeFilterOptions}
        />
      </ListToolbar>

      {list.isError ? (
        <Alert
          type="error"
          showIcon
          message={mapApiError(list.error).userMessage || common.loadError}
          action={
            <Button size="small" onClick={() => void list.refetch()}>
              {common.retry}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {isDesktop ? (
        <Table<Product>
          rowKey="id"
          loading={list.isLoading}
          columns={columns}
          dataSource={list.data?.data ?? []}
          pagination={false}
          locale={{ emptyText: labels.empty }}
          scroll={{ x: true }}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {list.isLoading ? <Text type="secondary">{common.loading}</Text> : null}
          {!list.isLoading && (list.data?.data.length ?? 0) === 0 ? (
            <Text type="secondary">{labels.empty}</Text>
          ) : null}
          {(list.data?.data ?? []).map((product) => (
            <Card key={product.id} size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>
                  {product.code} — {product.name}
                </Text>
                <Text type="secondary">
                  {labels.type}: {productTypeLabel(product.type)}
                </Text>
                <Text type="secondary">
                  {labels.unit}: {product.unit.code} — {product.unit.name}
                </Text>
                <Text type="secondary">
                  {labels.category}: {product.category ?? '—'}
                </Text>
                <Text type="secondary">
                  {labels.standardSalePrice}:{' '}
                  {product.standardSalePrice ?? '—'}
                </Text>
                <ActiveStatusTag isActive={product.isActive} />
                <Space wrap>
                  <Button onClick={() => openEdit(product)}>
                    {common.edit}
                  </Button>
                  {product.isActive ? (
                    <Button danger onClick={() => confirmDeactivate(product)}>
                      {common.deactivate}
                    </Button>
                  ) : null}
                </Space>
              </Space>
            </Card>
          ))}
        </Space>
      )}

      <Pagination
        style={{ marginTop: 16, textAlign: 'right' }}
        current={page}
        pageSize={pageSize}
        total={list.data?.meta.total ?? 0}
        showSizeChanger
        onChange={(nextPage, nextPageSize) => {
          setPage(nextPage);
          setPageSize(nextPageSize);
        }}
      />

      <ProductFormModal
        open={formMode.kind !== 'closed'}
        title={formMode.kind === 'edit' ? labels.edit : labels.create}
        mode={formMode.kind === 'edit' ? 'edit' : 'create'}
        readOnlyCode={
          formMode.kind === 'edit' ? formMode.product.code : undefined
        }
        fallbackUnitOption={fallbackUnitOption}
        initialValues={editInitialValues}
        submitting={submitting}
        errorMessage={formError}
        onCancel={closeForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
