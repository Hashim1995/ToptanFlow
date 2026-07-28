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
import type { Currency } from '../api/currencies.api';
import {
  useCreateCurrency,
  useCurrenciesList,
  useDeactivateCurrency,
  useUpdateCurrency,
} from '../api/currencies.hooks';
import type { CurrencyFormValues } from '../forms/reference-data.schemas';
import { ActiveStatusTag } from '../ui/active-status-tag';
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from '../ui/active-filter';
import { MASTER_DATA_LABELS } from '../ui/labels';
import { ActiveStatusFilter, FilterBar, FilterField } from '../ui/list-toolbar';
import { PageHeader } from '../ui/page-header';
import { CurrencyFormModal } from '../ui/reference-form-modals';

const { Text } = Typography;

type FormMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; currency: Currency };

export function CurrenciesPage() {
  const labels = MASTER_DATA_LABELS.currencies;
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

  const list = useCurrenciesList(listQuery);
  const createMutation = useCreateCurrency();
  const updateMutation = useUpdateCurrency();
  const deactivateMutation = useDeactivateCurrency();

  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<Currency> = [
    { title: common.code, dataIndex: 'code', key: 'code' },
    { title: common.name, dataIndex: 'name', key: 'name' },
    {
      title: common.symbol,
      dataIndex: 'symbol',
      key: 'symbol',
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

  function openEdit(currency: Currency) {
    setFormError(undefined);
    setFormMode({ kind: 'edit', currency });
  }

  function closeForm() {
    setFormMode({ kind: 'closed' });
    setFormError(undefined);
  }

  async function handleSubmit(values: CurrencyFormValues) {
    setFormError(undefined);
    const payload = {
      code: values.code.trim(),
      name: values.name.trim(),
      symbol: values.symbol?.trim() ? values.symbol.trim() : null,
    };

    try {
      if (formMode.kind === 'create') {
        await createMutation.mutateAsync(payload);
        message.success(common.createSuccess);
      } else if (formMode.kind === 'edit') {
        await updateMutation.mutateAsync({
          id: formMode.currency.id,
          input: payload,
        });
        message.success(common.updateSuccess);
      }
      closeForm();
    } catch (error) {
      setFormError(mapApiError(error).userMessage);
    }
  }

  function confirmDeactivate(currency: Currency) {
    Modal.confirm({
      title: labels.deactivateConfirm,
      okText: common.confirm,
      cancelText: common.cancel,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateMutation.mutateAsync(currency.id);
          message.success(common.deactivateSuccess);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  function confirmActivate(currency: Currency) {
    Modal.confirm({
      title: labels.activateConfirm,
      okText: common.confirm,
      cancelText: common.cancel,
      onOk: async () => {
        try {
          await updateMutation.mutateAsync({
            id: currency.id,
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
          code: formMode.currency.code,
          name: formMode.currency.name,
          symbol: formMode.currency.symbol ?? '',
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
        <Table<Currency>
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
          {(list.data?.data ?? []).map((currency) => (
            <Card key={currency.id} size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>
                  {currency.code} — {currency.name}
                </Text>
                <Text type="secondary">
                  {common.symbol}: {currency.symbol ?? '—'}
                </Text>
                <ActiveStatusTag isActive={currency.isActive} />
                <Space wrap>
                  <Button onClick={() => openEdit(currency)}>
                    {common.edit}
                  </Button>
                  {currency.isActive ? (
                    <Button danger onClick={() => confirmDeactivate(currency)}>
                      {common.deactivate}
                    </Button>
                  ) : (
                    <Button onClick={() => confirmActivate(currency)}>
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

      <CurrencyFormModal
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
