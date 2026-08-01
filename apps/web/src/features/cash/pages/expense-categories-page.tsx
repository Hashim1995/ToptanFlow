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
  Receipt,
} from '@phosphor-icons/react';
import { mapApiError } from '../../../api/map-api-error';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from '../../master-data/ui/active-filter';
import { ActiveStatusTag } from '../../master-data/ui/active-status-tag';
import {
  ActiveStatusFilter,
  FilterBar,
  FilterField,
} from '../../master-data/ui/list-toolbar';
import { PageHeader } from '../../master-data/ui/page-header';
import type { ExpenseCategory } from '../api/expense-categories.api';
import {
  useCreateExpenseCategory,
  useDeactivateExpenseCategory,
  useExpenseCategoriesList,
  useReactivateExpenseCategory,
  useUpdateExpenseCategory,
} from '../api/cash.hooks';
import type { ExpenseCategoryFormValues } from '../forms/cash.schemas';
import { ExpenseCategoryFormModal } from '../ui/cash-form-modals';
import { CASH_LABELS } from '../ui/labels';

const { Text } = Typography;

type FormMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; category: ExpenseCategory };

export function ExpenseCategoriesPage() {
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
      sortBy: 'name' as const,
      sortOrder: 'asc' as const,
    }),
    [page, pageSize, search, activeFilter],
  );

  const list = useExpenseCategoriesList(listQuery);
  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();
  const deactivateMutation = useDeactivateExpenseCategory();
  const reactivateMutation = useReactivateExpenseCategory();
  const submitting = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(values: ExpenseCategoryFormValues) {
    setFormError(undefined);
    try {
      if (formMode.kind === 'create') {
        await createMutation.mutateAsync({ name: values.name });
        message.success(CASH_LABELS.success.categoryCreated);
      } else if (formMode.kind === 'edit') {
        await updateMutation.mutateAsync({
          id: formMode.category.id,
          name: values.name,
        });
        message.success(CASH_LABELS.success.categoryUpdated);
      }
      setFormMode({ kind: 'closed' });
    } catch (error) {
      setFormError(mapApiError(error).userMessage);
    }
  }

  function confirmDeactivate(category: ExpenseCategory) {
    Modal.confirm({
      title: CASH_LABELS.deactivate,
      content: CASH_LABELS.confirmations.deactivate,
      okText: CASH_LABELS.deactivate,
      cancelText: CASH_LABELS.cancel,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateMutation.mutateAsync({ id: category.id });
          message.success(CASH_LABELS.success.categoryDeactivated);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  const columns: ColumnsType<ExpenseCategory> = [
    {
      title: CASH_LABELS.columns.status,
      dataIndex: 'isActive',
      width: 110,
      render: (isActive: boolean) => <ActiveStatusTag isActive={isActive} />,
    },
    {
      title: CASH_LABELS.columns.name,
      dataIndex: 'name',
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: CASH_LABELS.columns.actions,
      key: 'actions',
      width: 200,
      render: (_: unknown, record) => (
        <Space>
          <Button
            size="small"
            icon={phIcon(PencilSimple, { size: ICON_SIZE.sm })}
            onClick={() => setFormMode({ kind: 'edit', category: record })}
          >
            {CASH_LABELS.editExpenseCategory}
          </Button>
          {record.isActive ? (
            <Button
              size="small"
              danger
              icon={phIcon(Prohibit, { size: ICON_SIZE.sm })}
              onClick={() => confirmDeactivate(record)}
            >
              {CASH_LABELS.deactivate}
            </Button>
          ) : (
            <Button
              size="small"
              icon={phIcon(Power, { size: ICON_SIZE.sm })}
              onClick={async () => {
                try {
                  await reactivateMutation.mutateAsync(record.id);
                  message.success(CASH_LABELS.success.categoryReactivated);
                } catch (error) {
                  message.error(mapApiError(error).userMessage);
                }
              }}
            >
              {CASH_LABELS.reactivate}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const rows = list.data?.data ?? [];

  return (
    <>
      <PageHeader
        title={CASH_LABELS.expenseCategories}
        description={CASH_LABELS.expenseCategoriesDescription}
        icon={phIcon(Receipt, { size: ICON_SIZE.lg })}
        extra={
          <Button
            type="primary"
            icon={phIcon(Plus, { size: ICON_SIZE.sm })}
            onClick={() => setFormMode({ kind: 'create' })}
          >
            {CASH_LABELS.createExpenseCategory}
          </Button>
        }
      />

      <FilterBar>
        <FilterField label={CASH_LABELS.filters.search}>
          <Input.Search
            allowClear
            placeholder={CASH_LABELS.filters.searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={(value) => {
              setSearch(value.trim());
              setPage(1);
            }}
            style={{ minWidth: 220 }}
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
          style={{ marginBottom: 16 }}
          message={mapApiError(list.error).userMessage}
          action={
            <Button size="small" onClick={() => void list.refetch()}>
              {CASH_LABELS.retry}
            </Button>
          }
        />
      ) : null}

      {isDesktop ? (
        <Table<ExpenseCategory>
          rowKey="id"
          loading={list.isLoading}
          columns={columns}
          dataSource={rows}
          pagination={false}
          locale={{ emptyText: CASH_LABELS.empty }}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {rows.map((category) => (
            <Card
              key={category.id}
              size="small"
              title={
                <Space>
                  <Text strong>{category.name}</Text>
                  <ActiveStatusTag isActive={category.isActive} />
                </Space>
              }
            >
              <Space wrap>
                <Button
                  size="small"
                  onClick={() =>
                    setFormMode({ kind: 'edit', category })
                  }
                >
                  {CASH_LABELS.editExpenseCategory}
                </Button>
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
        onChange={(nextPage, nextSize) => {
          setPage(nextPage);
          setPageSize(nextSize);
        }}
      />

      <ExpenseCategoryFormModal
        open={formMode.kind !== 'closed'}
        mode={formMode.kind === 'edit' ? 'edit' : 'create'}
        initialName={
          formMode.kind === 'edit' ? formMode.category.name : undefined
        }
        submitting={submitting}
        error={formError}
        onCancel={() => {
          setFormMode({ kind: 'closed' });
          setFormError(undefined);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}
