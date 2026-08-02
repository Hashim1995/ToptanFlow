import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Dropdown,
  Empty,
  Grid,
  Input,
  Modal,
  Pagination,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DotsThreeVertical,
  FunnelSimple,
  PencilSimple,
  Phone,
  Plus,
  Power,
  Prohibit,
  UsersThree,
} from '@phosphor-icons/react';
import { mapApiError } from '../../../api/map-api-error';
import { debtBalanceSignLabel } from '../../../shared/money/debt-balance-label';
import { formatMoney } from '../../../shared/money/format-money';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import { CodeText, MoneyCell } from '../../../shared/ui/table-cells';
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
import { ActiveStatusFilter, FilterBar, FilterField } from '../ui/list-toolbar';
import { PageHeader } from '../ui/page-header';
import './business-partners-page.css';

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
  return candidates.filter(
    (item): item is BusinessPartnerDuplicateCandidate => {
      if (typeof item !== 'object' || item === null) return false;
      const row = item as Partial<BusinessPartnerDuplicateCandidate>;
      return (
        typeof row.code === 'string' &&
        typeof row.name === 'string' &&
        Array.isArray(row.matchedFields)
      );
    },
  );
}

function toPayload(
  values: BusinessPartnerFormValues,
): CreateBusinessPartnerInput {
  return {
    name: values.name.trim(),
    isCustomer: values.isCustomer,
    isSupplier: values.isSupplier,
    phone: emptyToNull(values.phone ?? ''),
    email: emptyToNull(values.email ?? ''),
    taxNumber: emptyToNull(values.taxNumber ?? ''),
    address: emptyToNull(values.address ?? ''),
    notes: emptyToNull(values.notes ?? ''),
  };
}

function DebtBalanceCell({ balance }: { balance: string }) {
  return (
    <Space direction="vertical" size={0}>
      <Text>{formatMoney(balance)}</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {debtBalanceSignLabel(balance)}
      </Text>
    </Space>
  );
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
    {
      title: common.status,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (isActive: boolean) => <ActiveStatusTag isActive={isActive} />,
    },
    {
      title: labels.partnerCode,
      dataIndex: 'code',
      key: 'code',
      width: 110,
      render: (value: string) => <CodeText value={value} />,
    },
    {
      title: labels.partnerName,
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: labels.role,
      key: 'role',
      width: 150,
      render: (_, record) => (
        <Tag style={{ marginInlineEnd: 0 }}>{roleLabel(record)}</Tag>
      ),
    },
    {
      title: labels.phone,
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (value: string | null) =>
        value ? (
          <Space size={6}>
            {phIcon(Phone, { size: ICON_SIZE.sm })}
            <Text>{value}</Text>
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: labels.debtBalance,
      key: 'currentDebtBalance',
      width: 160,
      align: 'right',
      render: (_, record) => (
        <Space direction="vertical" size={0} style={{ width: '100%' }}>
          <MoneyCell
            value={record.currentDebtBalance}
            format={formatMoney}
            emphasize
          />
          <Text type="secondary" style={{ fontSize: 11, textAlign: 'right' }}>
            {debtBalanceSignLabel(record.currentDebtBalance)}
          </Text>
        </Space>
      ),
    },
    {
      title: common.actions,
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'edit',
            icon: phIcon(PencilSimple, { size: ICON_SIZE.sm }),
            label: common.edit,
            onClick: () => openEdit(record),
          },
          { type: 'divider' },
          record.isActive
            ? {
                key: 'deactivate',
                danger: true,
                icon: phIcon(Prohibit, { size: ICON_SIZE.sm }),
                label: common.deactivate,
                onClick: () => confirmDeactivate(record),
              }
            : {
                key: 'activate',
                icon: phIcon(Power, { size: ICON_SIZE.sm }),
                label: common.activate,
                onClick: () => confirmActivate(record),
              },
        ];
        return (
          <Space size={4}>
            <Tooltip title={common.edit}>
              <Button
                type="text"
                size="small"
                icon={phIcon(PencilSimple, { size: ICON_SIZE.sm })}
                aria-label={common.edit}
                onClick={() => openEdit(record)}
              />
            </Tooltip>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button
                className="partners-row-menu"
                type="text"
                size="small"
                icon={phIcon(DotsThreeVertical, {
                  size: ICON_SIZE.md,
                  weight: 'bold',
                })}
                aria-label={common.actions}
              />
            </Dropdown>
          </Space>
        );
      },
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
      if (mapped.statusCode === 409 && mapped.code === DUPLICATE_CODE) {
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
      className: 'app-mobile-modal partners-confirm-modal',
      centered: true,
      title: labels.deactivateConfirm,
      content: (
        <div className="partners-confirm-entity">
          <CodeText value={partner.code} />
          <Text strong>{partner.name}</Text>
        </div>
      ),
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

  function confirmActivate(partner: BusinessPartner) {
    Modal.confirm({
      className: 'app-mobile-modal partners-confirm-modal',
      centered: true,
      title: labels.activateConfirm,
      content: (
        <div className="partners-confirm-entity">
          <CodeText value={partner.code} />
          <Text strong>{partner.name}</Text>
        </div>
      ),
      okText: common.confirm,
      cancelText: common.cancel,
      onOk: async () => {
        try {
          await updateMutation.mutateAsync({
            id: partner.id,
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

  const editInitialValues: BusinessPartnerFormValues | undefined =
    formMode.kind === 'edit'
      ? {
          name: formMode.partner.name,
          isCustomer: formMode.partner.isCustomer,
          isSupplier: formMode.partner.isSupplier,
          phone: formMode.partner.phone ?? '',
          email: formMode.partner.email ?? '',
          taxNumber: formMode.partner.taxNumber ?? '',
          address: formMode.partner.address ?? '',
          notes: formMode.partner.notes ?? '',
        }
      : undefined;
  const partners = list.data?.data ?? [];
  const partnerTotal = list.data?.meta.total ?? 0;

  return (
    <div className="business-partners-page">
      <PageHeader
        title={labels.title}
        description={labels.description}
        icon={phIcon(UsersThree, { size: ICON_SIZE.xl, weight: 'duotone' })}
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

      <Card className="partners-filter-card" size="small">
        <div className="partners-filter-heading">
          <div>
            <span className="partners-filter-icon">
              {phIcon(FunnelSimple, { size: ICON_SIZE.sm, weight: 'bold' })}
            </span>
            <Text strong>{common.search}</Text>
          </div>
          <Tag className="partners-result-count" color="blue">
            {partnerTotal}
          </Tag>
        </div>
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
            />
          </FilterField>
          <ActiveStatusFilter
            value={activeFilter}
            onChange={(value) => {
              setActiveFilter(value);
              setPage(1);
            }}
          />
          <FilterField label={labels.filterRole}>
            <Select
              value={roleFilter}
              onChange={(value: RoleFilterValue) => {
                setRoleFilter(value);
                setPage(1);
              }}
              aria-label={labels.filterRole}
              options={[
                { value: 'all', label: common.all },
                { value: 'customer', label: labels.customer },
                { value: 'supplier', label: labels.supplier },
                { value: 'both', label: labels.bothRoles },
              ]}
            />
          </FilterField>
        </FilterBar>
      </Card>

      {list.isError ? (
        <Alert
          className="partners-page-alert"
          type="error"
          showIcon
          message={mapApiError(list.error).userMessage || common.loadError}
          action={
            <Button size="small" onClick={() => void list.refetch()}>
              {common.retry}
            </Button>
          }
        />
      ) : null}

      {isDesktop ? (
        <div className="partners-table-shell">
          <Table<BusinessPartner>
            className="partners-table"
            rowKey="id"
            loading={list.isLoading}
            columns={columns}
            dataSource={partners}
            pagination={false}
            locale={{ emptyText: labels.empty }}
            scroll={{ x: 980 }}
          />
        </div>
      ) : (
        <div className="partners-mobile-list">
          {list.isLoading ? (
            <Card className="partner-mobile-card">
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          ) : null}
          {!list.isLoading && partners.length === 0 ? (
            <Card className="partners-empty-card">
              <Empty description={labels.empty} />
            </Card>
          ) : null}
          {partners.map((partner) => (
            <Card
              className={`partner-mobile-card${
                partner.isActive ? '' : ' is-inactive'
              }`}
              key={partner.id}
              size="small"
            >
              <div className="partner-mobile-topline">
                <div className="partner-mobile-identity">
                  <div>
                    <Text type="secondary">{labels.partnerCode}</Text>
                    <CodeText value={partner.code} />
                  </div>
                  <div>
                    <Text type="secondary">{labels.partnerName}</Text>
                    <Text strong className="partner-mobile-name">
                      {partner.name}
                    </Text>
                  </div>
                </div>
                <ActiveStatusTag isActive={partner.isActive} />
              </div>

              <div className="partner-mobile-tags">
                <Tag color="blue">{roleLabel(partner)}</Tag>
              </div>

              <div className="partner-mobile-balance">
                <Text type="secondary">{labels.debtBalance}</Text>
                <DebtBalanceCell balance={partner.currentDebtBalance} />
              </div>

              <div className="partner-mobile-details">
                <div>
                  <Text type="secondary">{labels.phone}</Text>
                  <strong>{partner.phone ?? '—'}</strong>
                </div>
                <div>
                  <Text type="secondary">{labels.email}</Text>
                  <strong>{partner.email ?? '—'}</strong>
                </div>
                <div>
                  <Text type="secondary">{labels.taxNumber}</Text>
                  <strong>{partner.taxNumber ?? '—'}</strong>
                </div>
              </div>

              <div className="partner-mobile-actions">
                <Button
                  icon={phIcon(PencilSimple, { size: ICON_SIZE.sm })}
                  onClick={() => openEdit(partner)}
                >
                  {common.edit}
                </Button>
                {partner.isActive ? (
                  <Button
                    danger
                    icon={phIcon(Prohibit, { size: ICON_SIZE.sm })}
                    onClick={() => confirmDeactivate(partner)}
                  >
                    {common.deactivate}
                  </Button>
                ) : (
                  <Button
                    icon={phIcon(Power, { size: ICON_SIZE.sm })}
                    onClick={() => confirmActivate(partner)}
                  >
                    {common.activate}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {partnerTotal > 0 ? (
        <div className="partners-pagination">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={partnerTotal}
            showSizeChanger
            responsive
            onChange={(nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            }}
          />
        </div>
      ) : null}

      <BusinessPartnerFormModal
        open={formMode.kind !== 'closed'}
        title={formMode.kind === 'edit' ? labels.edit : labels.create}
        mode={formMode.kind === 'edit' ? 'edit' : 'create'}
        readOnlyCode={
          formMode.kind === 'edit' ? formMode.partner.code : undefined
        }
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
