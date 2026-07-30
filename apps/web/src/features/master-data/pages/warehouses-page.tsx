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
import type { Warehouse, WarehouseKind } from '../api/warehouses.api';
import {
  useCreateWarehouse,
  useDeactivateWarehouse,
  useUpdateWarehouse,
  useWarehousesList,
} from '../api/warehouses.hooks';
import type { WarehouseFormValues } from '../forms/warehouse.schemas';
import { ActiveStatusTag } from '../ui/active-status-tag';
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from '../ui/active-filter';
import { MASTER_DATA_LABELS, warehouseKindLabel } from '../ui/labels';
import { ActiveStatusFilter, FilterBar, FilterField } from '../ui/list-toolbar';
import { PageHeader } from '../ui/page-header';
import { WarehouseFormModal } from '../ui/warehouse-form-modal';

const { Text } = Typography;

type FormMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; warehouse: Warehouse };

type KindFilterValue = 'all' | WarehouseKind;

export function WarehousesPage() {
  const labels = MASTER_DATA_LABELS.warehouses;
  const common = MASTER_DATA_LABELS.common;
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>('all');
  const [kindFilter, setKindFilter] = useState<KindFilterValue>('all');
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
      kind: kindFilter === 'all' ? undefined : kindFilter,
      sortBy: 'code',
      sortOrder: 'asc' as const,
    }),
    [page, pageSize, search, activeFilter, kindFilter],
  );

  const list = useWarehousesList(listQuery);
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const deactivateMutation = useDeactivateWarehouse();

  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<Warehouse> = [
    { title: common.code, dataIndex: 'code', key: 'code' },
    { title: common.name, dataIndex: 'name', key: 'name' },
    {
      title: labels.kind,
      dataIndex: 'kind',
      key: 'kind',
      render: (kind: WarehouseKind) => warehouseKindLabel(kind),
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
            <Button
              type="link"
              danger
              onClick={() => confirmDeactivate(record)}
            >
              {common.deactivate}
            </Button>
          ) : (
            <Button type="link" onClick={() => confirmActivate(record)}>
              {common.activate}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  function openCreate() {
    setFormError(undefined);
    setFormMode({ kind: 'create' });
  }

  function openEdit(warehouse: Warehouse) {
    setFormError(undefined);
    setFormMode({ kind: 'edit', warehouse });
  }

  function closeForm() {
    setFormMode({ kind: 'closed' });
    setFormError(undefined);
  }

  async function handleSubmit(values: WarehouseFormValues) {
    setFormError(undefined);
    const payload = {
      name: values.name.trim(),
      kind: values.kind,
    };

    try {
      if (formMode.kind === 'create') {
        await createMutation.mutateAsync(payload);
        message.success(common.createSuccess);
      } else if (formMode.kind === 'edit') {
        await updateMutation.mutateAsync({
          id: formMode.warehouse.id,
          input: payload,
        });
        message.success(common.updateSuccess);
      }
      closeForm();
    } catch (error) {
      setFormError(mapApiError(error).userMessage);
    }
  }

  function confirmDeactivate(warehouse: Warehouse) {
    Modal.confirm({
      title: labels.deactivateConfirm,
      okText: common.confirm,
      cancelText: common.cancel,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateMutation.mutateAsync(warehouse.id);
          message.success(common.deactivateSuccess);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  function confirmActivate(warehouse: Warehouse) {
    Modal.confirm({
      title: labels.activateConfirm,
      okText: common.confirm,
      cancelText: common.cancel,
      onOk: async () => {
        try {
          await updateMutation.mutateAsync({
            id: warehouse.id,
            input: { isActive: true },
          });
          message.success(common.activateSuccess);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  const editInitialValues: WarehouseFormValues | undefined =
    formMode.kind === 'edit'
      ? {
          name: formMode.warehouse.name,
          kind: formMode.warehouse.kind,
        }
      : undefined;

  const kindFilterOptions = [
    { value: 'all' as const, label: common.all },
    ...(Object.keys(labels.kinds) as WarehouseKind[]).map((kind) => ({
      value: kind,
      label: warehouseKindLabel(kind),
    })),
  ];

  return (
    <div>
      <PageHeader
        title={labels.title}
        description={labels.description}
        extra={
          <Button type="primary" onClick={openCreate}>
            {labels.create}
          </Button>
        }
      />

      <FilterBar>
        <FilterField label={common.search}>
          <Input.Search
            allowClear
            placeholder={common.searchPlaceholder}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => {
              setSearch(value.trim());
              setPage(1);
            }}
            style={{ minWidth: 220, maxWidth: 320 }}
          />
        </FilterField>
        <ActiveStatusFilter
          value={activeFilter}
          onChange={(value) => {
            setActiveFilter(value);
            setPage(1);
          }}
        />
        <FilterField label={labels.filterKind}>
          <Select
            value={kindFilter}
            onChange={(value: KindFilterValue) => {
              setKindFilter(value);
              setPage(1);
            }}
            options={kindFilterOptions}
            style={{ minWidth: 160 }}
            aria-label={labels.filterKind}
          />
        </FilterField>
      </FilterBar>

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
        <Table<Warehouse>
          rowKey="id"
          loading={list.isLoading}
          columns={columns}
          dataSource={list.data?.data ?? []}
          pagination={false}
          locale={{ emptyText: labels.empty }}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {list.isLoading ? <Text type="secondary">{common.loading}</Text> : null}
          {!list.isLoading && (list.data?.data.length ?? 0) === 0 ? (
            <Text type="secondary">{labels.empty}</Text>
          ) : null}
          {(list.data?.data ?? []).map((warehouse) => (
            <Card key={warehouse.id} size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>
                  {warehouse.code} — {warehouse.name}
                </Text>
                <Text type="secondary">
                  {labels.kind}: {warehouseKindLabel(warehouse.kind)}
                </Text>
                <ActiveStatusTag isActive={warehouse.isActive} />
                <Space wrap>
                  <Button onClick={() => openEdit(warehouse)}>
                    {common.edit}
                  </Button>
                  {warehouse.isActive ? (
                    <Button danger onClick={() => confirmDeactivate(warehouse)}>
                      {common.deactivate}
                    </Button>
                  ) : (
                    <Button onClick={() => confirmActivate(warehouse)}>
                      {common.activate}
                    </Button>
                  )}
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

      <WarehouseFormModal
        open={formMode.kind !== 'closed'}
        title={formMode.kind === 'edit' ? labels.edit : labels.create}
        mode={formMode.kind === 'edit' ? 'edit' : 'create'}
        readOnlyCode={
          formMode.kind === 'edit' ? formMode.warehouse.code : undefined
        }
        initialValues={editInitialValues}
        submitting={submitting}
        errorMessage={formError}
        onCancel={closeForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
