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
import type {
  BusinessPartner,
  CreateBusinessPartnerInput,
  UpdateBusinessPartnerInput,
} from '../api/business-partners.api';
import {
  useBusinessPartnersList,
  useCreateBusinessPartner,
  useDeactivateBusinessPartner,
  useUpdateBusinessPartner,
} from '../api/business-partners.hooks';
import type { BusinessPartnerDuplicateCandidate } from '../api/master-data.types';
import type { BusinessPartnerFormValues } from '../forms/business-partner.schemas';
import { ActiveStatusTag } from '../ui/active-status-tag';
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from '../ui/active-filter';
import { BusinessPartnerFormModal } from '../ui/business-partner-form-modal';
import { DuplicateReviewModal } from '../ui/duplicate-review-modal';
import { MASTER_DATA_LABELS } from '../ui/labels';
import { ActiveStatusFilter, FilterBar } from '../ui/list-toolbar';
import { PageHeader } from '../ui/page-header';

const { Text } = Typography;

const DUPLICATE_CODE = 'BUSINESS_PARTNER_DUPLICATE_SUSPECTED';

type FormMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; partner: BusinessPartner };

type RoleFilterValue = 'all' | 'customer' | 'supplier' | 'both';

type PendingSubmit = {
  mode: 'create' | 'edit';
  partnerId?: string;
  payload: CreateBusinessPartnerInput | UpdateBusinessPartnerInput;
};

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function roleLabel(partner: {
  isCustomer: boolean;
  isSupplier: boolean;
}): string {
  const labels = MASTER_DATA_LABELS.partners;
  if (partner.isCustomer && partner.isSupplier) return labels.bothRoles;
  if (partner.isCustomer) return labels.customer;
  if (partner.isSupplier) return labels.supplier;
  return '—';
}

function roleFilterToQuery(value: RoleFilterValue): {
  isCustomer?: boolean;
  isSupplier?: boolean;
} {
  if (value === 'customer') return { isCustomer: true };
  if (value === 'supplier') return { isSupplier: true };
  if (value === 'both') return { isCustomer: true, isSupplier: true };
  return {};
}

function parseDuplicateCandidates(
  candidates: unknown[] | undefined,
): BusinessPartnerDuplicateCandidate[] {
  if (!candidates) return [];
  return candidates.filter((item): item is BusinessPartnerDuplicateCandidate => {
    if (typeof item !== 'object' || item === null) return false;
    const row = item as Partial<BusinessPartnerDuplicateCandidate>;
    return (
      typeof row.code === 'string' &&
      typeof row.name === 'string' &&
      Array.isArray(row.matchedFields)
    );
  });
}

function toPayload(
  values: BusinessPartnerFormValues,
): CreateBusinessPartnerInput {
  return {
    name: values.name.trim(),
    isCustomer: values.isCustomer,
    isSupplier: values.isSupplier,
    defaultCurrencyId: values.defaultCurrencyId,
    phone: emptyToNull(values.phone ?? ''),
    email: emptyToNull(values.email ?? ''),
    taxNumber: emptyToNull(values.taxNumber ?? ''),
    address: emptyToNull(values.address ?? ''),
    notes: emptyToNull(values.notes ?? ''),
  };
}

export function BusinessPartnersPage() {
  const labels = MASTER_DATA_LABELS.partners;
  const common = MASTER_DATA_LABELS.common;
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'closed' });
  const [formError, setFormError] = useState<string | undefined>();
  const [pendingSubmit, setPendingSubmit] = useState<PendingSubmit | null>(
    null,
  );
  const [duplicateCandidates, setDuplicateCandidates] = useState<
    BusinessPartnerDuplicateCandidate[]
  >([]);

  const listQuery = useMemo(
    () => ({
      page,
      pageSize,
      search: search || undefined,
      isActive: activeFilterToIsActive(activeFilter),
      ...roleFilterToQuery(roleFilter),
      sortBy: 'code',
      sortOrder: 'asc' as const,
    }),
    [page, pageSize, search, activeFilter, roleFilter],
  );

  const list = useBusinessPartnersList(listQuery);
  const createMutation = useCreateBusinessPartner();
  const updateMutation = useUpdateBusinessPartner();
  const deactivateMutation = useDeactivateBusinessPartner();
  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<BusinessPartner> = [
    { title: common.code, dataIndex: 'code', key: 'code', width: 110 },
    { title: common.name, dataIndex: 'name', key: 'name' },
    {
      title: labels.role,
      key: 'role',
      render: (_, record) => roleLabel(record),
    },
    {
      title: labels.phone,
      dataIndex: 'phone',
      key: 'phone',
      render: (value: string | null) => value ?? '—',
    },
    {
      title: labels.defaultCurrency,
      key: 'currency',
      render: (_, record) =>
        `${record.defaultCurrency.code} — ${record.defaultCurrency.name}`,
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
    setDuplicateCandidates([]);
    setPendingSubmit(null);
    setFormMode({ kind: 'create' });
  }

  function openEdit(partner: BusinessPartner) {
    setFormError(undefined);
    setDuplicateCandidates([]);
    setPendingSubmit(null);
    setFormMode({ kind: 'edit', partner });
  }

  function closeForm() {
    setFormMode({ kind: 'closed' });
    setFormError(undefined);
    setDuplicateCandidates([]);
    setPendingSubmit(null);
  }

  async function executeSubmit(pending: PendingSubmit) {
    if (pending.mode === 'create') {
      await createMutation.mutateAsync(
        pending.payload as CreateBusinessPartnerInput,
      );
      message.success(common.createSuccess);
    } else {
      await updateMutation.mutateAsync({
        id: pending.partnerId!,
        input: pending.payload as UpdateBusinessPartnerInput,
      });
      message.success(common.updateSuccess);
    }
    closeForm();
  }

  async function handleSubmit(values: BusinessPartnerFormValues) {
    setFormError(undefined);
    const payload = toPayload(values);
    const pending: PendingSubmit =
      formMode.kind === 'edit'
        ? { mode: 'edit', partnerId: formMode.partner.id, payload }
        : { mode: 'create', payload };

    try {
      await executeSubmit(pending);
    } catch (error) {
      const mapped = mapApiError(error);
      if (
        mapped.statusCode === 409 &&
        mapped.code === DUPLICATE_CODE
      ) {
        setPendingSubmit(pending);
        setDuplicateCandidates(parseDuplicateCandidates(mapped.candidates));
        return;
      }
      setFormError(mapped.userMessage);
    }
  }

  async function acknowledgeDuplicate() {
    if (!pendingSubmit) return;
    try {
      await executeSubmit({
        ...pendingSubmit,
        payload: {
          ...pendingSubmit.payload,
          acknowledgeDuplicate: true,
        },
      });
    } catch (error) {
      setFormError(mapApiError(error).userMessage);
      setDuplicateCandidates([]);
      setPendingSubmit(null);
    }
  }

  function confirmDeactivate(partner: BusinessPartner) {
    Modal.confirm({
      title: labels.deactivateConfirm,
      okText: common.confirm,
      cancelText: common.cancel,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateMutation.mutateAsync(partner.id);
          message.success(common.deactivateSuccess);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  const editInitialValues: BusinessPartnerFormValues | undefined =
    formMode.kind === 'edit'
      ? {
          name: formMode.partner.name,
          isCustomer: formMode.partner.isCustomer,
          isSupplier: formMode.partner.isSupplier,
          defaultCurrencyId: formMode.partner.defaultCurrencyId,
          phone: formMode.partner.phone ?? '',
          email: formMode.partner.email ?? '',
          taxNumber: formMode.partner.taxNumber ?? '',
          address: formMode.partner.address ?? '',
          notes: formMode.partner.notes ?? '',
        }
      : undefined;

  const fallbackCurrencyOption =
    formMode.kind === 'edit'
      ? {
          value: formMode.partner.defaultCurrencyId,
          label: `${formMode.partner.defaultCurrency.code} — ${formMode.partner.defaultCurrency.name}`,
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
        <ActiveStatusFilter
          value={activeFilter}
          onChange={(value) => {
            setActiveFilter(value);
            setPage(1);
          }}
        />
        <Select
          value={roleFilter}
          onChange={(value: RoleFilterValue) => {
            setRoleFilter(value);
            setPage(1);
          }}
          style={{ minWidth: 160 }}
          aria-label={labels.filterRole}
          placeholder={labels.filterRole}
          options={[
            { value: 'all', label: common.all },
            { value: 'customer', label: labels.customer },
            { value: 'supplier', label: labels.supplier },
            { value: 'both', label: labels.bothRoles },
          ]}
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
        <Table<BusinessPartner>
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
          {(list.data?.data ?? []).map((partner) => (
            <Card key={partner.id} size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>
                  {partner.code} — {partner.name}
                </Text>
                <Text type="secondary">
                  {labels.role}: {roleLabel(partner)}
                </Text>
                <Text type="secondary">
                  {labels.phone}: {partner.phone ?? '—'}
                </Text>
                <Text type="secondary">
                  {labels.defaultCurrency}: {partner.defaultCurrency.code} —{' '}
                  {partner.defaultCurrency.name}
                </Text>
                <ActiveStatusTag isActive={partner.isActive} />
                <Space wrap>
                  <Button onClick={() => openEdit(partner)}>
                    {common.edit}
                  </Button>
                  {partner.isActive ? (
                    <Button danger onClick={() => confirmDeactivate(partner)}>
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

      <BusinessPartnerFormModal
        open={formMode.kind !== 'closed'}
        title={formMode.kind === 'edit' ? labels.edit : labels.create}
        mode={formMode.kind === 'edit' ? 'edit' : 'create'}
        readOnlyCode={
          formMode.kind === 'edit' ? formMode.partner.code : undefined
        }
        fallbackCurrencyOption={fallbackCurrencyOption}
        initialValues={editInitialValues}
        submitting={submitting && duplicateCandidates.length === 0}
        errorMessage={formError}
        onCancel={closeForm}
        onSubmit={handleSubmit}
      />

      <DuplicateReviewModal
        open={duplicateCandidates.length > 0}
        candidates={duplicateCandidates}
        submitting={submitting}
        onCancel={() => {
          setDuplicateCandidates([]);
          setPendingSubmit(null);
        }}
        onAcknowledge={() => void acknowledgeDuplicate()}
      />
    </div>
  );
}
