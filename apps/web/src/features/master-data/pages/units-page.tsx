import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Grid,
  Input,
  Modal,
  Pagination,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { mapApiError } from '../../../api/map-api-error';
import type { Unit } from '../api/units.api';
import {
  useCreateUnit,
  useDeactivateUnit,
  useUnitsList,
  useUpdateUnit,
} from '../api/units.hooks';
import type { UnitFormValues } from '../forms/reference-data.schemas';
import { ActiveStatusTag } from '../ui/active-status-tag';
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from '../ui/active-filter';
import { MASTER_DATA_LABELS } from '../ui/labels';
import { ActiveStatusFilter, FilterBar, FilterField } from '../ui/list-toolbar';
import { PageHeader } from '../ui/page-header';
import { UnitFormModal } from '../ui/reference-form-modals';

const { Text } = Typography;

type FormMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; unit: Unit };

export function UnitsPage() {
  const labels = MASTER_DATA_LABELS.units;
  const common = MASTER_DATA_LABELS.common;
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>('all');
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
      sortBy: 'code',
      sortOrder: 'asc' as const,
    }),
    [page, pageSize, search, activeFilter],
  );

  const list = useUnitsList(listQuery);
  const createMutation = useCreateUnit();
  const updateMutation = useUpdateUnit();
  const deactivateMutation = useDeactivateUnit();

  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<Unit> = [
    { title: common.code, dataIndex: 'code', key: 'code' },
    { title: common.name, dataIndex: 'name', key: 'name' },
    {
      title: common.fractional,
      dataIndex: 'allowsFractionalQuantity',
      key: 'allowsFractionalQuantity',
      render: (value: boolean) => (value ? common.yes : common.no),
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

  function openEdit(unit: Unit) {
    setFormError(undefined);
    setFormMode({ kind: 'edit', unit });
  }

  function closeForm() {
    setFormMode({ kind: 'closed' });
    setFormError(undefined);
  }

  async function handleSubmit(values: UnitFormValues) {
    setFormError(undefined);
    const payload = {
      code: values.code.trim(),
      name: values.name.trim(),
      allowsFractionalQuantity: values.allowsFractionalQuantity,
    };

    try {
      if (formMode.kind === 'create') {
        await createMutation.mutateAsync(payload);
        message.success(common.createSuccess);
      } else if (formMode.kind === 'edit') {
        await updateMutation.mutateAsync({
          id: formMode.unit.id,
          input: payload,
        });
        message.success(common.updateSuccess);
      }
      closeForm();
    } catch (error) {
      setFormError(mapApiError(error).userMessage);
    }
  }

  function confirmDeactivate(unit: Unit) {
    Modal.confirm({
      title: labels.deactivateConfirm,
      okText: common.confirm,
      cancelText: common.cancel,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateMutation.mutateAsync(unit.id);
          message.success(common.deactivateSuccess);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  function confirmActivate(unit: Unit) {
    Modal.confirm({
      title: labels.activateConfirm,
      okText: common.confirm,
      cancelText: common.cancel,
      onOk: async () => {
        try {
          await updateMutation.mutateAsync({
            id: unit.id,
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

  const editInitialValues =
    formMode.kind === 'edit'
      ? {
          code: formMode.unit.code,
          name: formMode.unit.name,
          allowsFractionalQuantity: formMode.unit.allowsFractionalQuantity,
        }
      : undefined;

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
        <Table<Unit>
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
          {(list.data?.data ?? []).map((unit) => (
            <Card key={unit.id} size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>
                  {unit.code} — {unit.name}
                </Text>
                <Text type="secondary">
                  {common.fractional}:{' '}
                  {unit.allowsFractionalQuantity ? common.yes : common.no}
                </Text>
                <ActiveStatusTag isActive={unit.isActive} />
                <Space wrap>
                  <Button onClick={() => openEdit(unit)}>{common.edit}</Button>
                  {unit.isActive ? (
                    <Button danger onClick={() => confirmDeactivate(unit)}>
                      {common.deactivate}
                    </Button>
                  ) : (
                    <Button onClick={() => confirmActivate(unit)}>
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

      <UnitFormModal
        open={formMode.kind !== 'closed'}
        title={formMode.kind === 'edit' ? labels.edit : labels.create}
        initialValues={editInitialValues}
        submitting={submitting}
        errorMessage={formError}
        onCancel={closeForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
