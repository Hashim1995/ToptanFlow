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
import {
  PencilSimple,
  Plus,
  Power,
  Prohibit,
  SquaresFour,
} from '@phosphor-icons/react';
import { mapApiError } from '../../../api/map-api-error';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import type { ProductCategory } from '../api/product-categories.api';
import {
  useCreateProductCategory,
  useDeactivateProductCategory,
  useProductCategoriesList,
  useUpdateProductCategory,
} from '../api/product-categories.hooks';
import type { ProductCategoryFormValues } from '../forms/reference-data.schemas';
import { ActiveStatusTag } from '../ui/active-status-tag';
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from '../ui/active-filter';
import { MASTER_DATA_LABELS } from '../ui/labels';
import { ActiveStatusFilter, FilterBar, FilterField } from '../ui/list-toolbar';
import { PageHeader } from '../ui/page-header';
import { ProductCategoryFormModal } from '../ui/reference-form-modals';

const { Text } = Typography;

type FormMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; category: ProductCategory };

export function ProductCategoriesPage() {
  const labels = MASTER_DATA_LABELS.categories;
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
      sortBy: 'name',
      sortOrder: 'asc' as const,
    }),
    [page, pageSize, search, activeFilter],
  );

  const list = useProductCategoriesList(listQuery);
  const createMutation = useCreateProductCategory();
  const updateMutation = useUpdateProductCategory();
  const deactivateMutation = useDeactivateProductCategory();
  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<ProductCategory> = [
    {
      title: common.status,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (isActive: boolean) => <ActiveStatusTag isActive={isActive} />,
    },
    {
      title: common.name,
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: common.actions,
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={phIcon(PencilSimple, { size: ICON_SIZE.sm })}
            onClick={() => openEdit(record)}
          >
            {common.edit}
          </Button>
          {record.isActive ? (
            <Button
              type="text"
              size="small"
              danger
              icon={phIcon(Prohibit, { size: ICON_SIZE.sm })}
              onClick={() => confirmDeactivate(record)}
            >
              {common.deactivate}
            </Button>
          ) : (
            <Button
              type="text"
              size="small"
              icon={phIcon(Power, { size: ICON_SIZE.sm })}
              onClick={() => confirmActivate(record)}
            >
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

  function openEdit(category: ProductCategory) {
    setFormError(undefined);
    setFormMode({ kind: 'edit', category });
  }

  function closeForm() {
    setFormMode({ kind: 'closed' });
    setFormError(undefined);
  }

  async function handleSubmit(values: ProductCategoryFormValues) {
    setFormError(undefined);
    const payload = { name: values.name.trim() };

    try {
      if (formMode.kind === 'create') {
        await createMutation.mutateAsync(payload);
        message.success(common.createSuccess);
      } else if (formMode.kind === 'edit') {
        await updateMutation.mutateAsync({
          id: formMode.category.id,
          input: payload,
        });
        message.success(common.updateSuccess);
      }
      closeForm();
    } catch (error) {
      setFormError(mapApiError(error).userMessage);
    }
  }

  function confirmDeactivate(category: ProductCategory) {
    Modal.confirm({
      title: labels.deactivateConfirm,
      okText: common.confirm,
      cancelText: common.cancel,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateMutation.mutateAsync(category.id);
          message.success(common.deactivateSuccess);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  function confirmActivate(category: ProductCategory) {
    Modal.confirm({
      title: labels.activateConfirm,
      okText: common.confirm,
      cancelText: common.cancel,
      onOk: async () => {
        try {
          await updateMutation.mutateAsync({
            id: category.id,
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
      ? { name: formMode.category.name }
      : undefined;

  return (
    <div>
      <PageHeader
        title={labels.title}
        description={labels.description}
        icon={phIcon(SquaresFour, { size: ICON_SIZE.xl, weight: 'duotone' })}
        extra={
          <Button
            type="primary"
            icon={phIcon(Plus, { size: ICON_SIZE.md, weight: 'bold' })}
            onClick={openCreate}
          >
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
        <Table<ProductCategory>
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
          {(list.data?.data ?? []).map((category) => (
            <Card key={category.id} size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{category.name}</Text>
                <ActiveStatusTag isActive={category.isActive} />
                <Space wrap>
                  <Button onClick={() => openEdit(category)}>
                    {common.edit}
                  </Button>
                  {category.isActive ? (
                    <Button danger onClick={() => confirmDeactivate(category)}>
                      {common.deactivate}
                    </Button>
                  ) : (
                    <Button onClick={() => confirmActivate(category)}>
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

      <ProductCategoryFormModal
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
