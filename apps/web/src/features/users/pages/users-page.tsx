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
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PencilSimple, Plus, Power, Prohibit, UsersThree } from '@phosphor-icons/react';
import { mapApiError } from '../../../api/map-api-error';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import { CodeText } from '../../../shared/ui/table-cells';
import {
  ActiveStatusFilter,
  FilterBar,
  FilterField,
} from '../../master-data/ui/list-toolbar';
import { PageHeader } from '../../master-data/ui/page-header';
import { ActiveStatusTag } from '../../master-data/ui/active-status-tag';
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from '../../master-data/ui/active-filter';
import type { AppUser } from '../api/users.api';
import {
  useCreateUser,
  useDeactivateUser,
  useUpdateUser,
  useUsersList,
} from '../api/users.hooks';
import type {
  CreateUserFormValues,
  EditUserFormValues,
} from '../forms/users.schemas';
import { USERS_LABELS } from '../ui/labels';
import {
  CreateUserFormModal,
  EditUserFormModal,
} from '../ui/user-form-modals';

const { Text } = Typography;

type FormMode =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; user: AppUser };

export function UsersPage() {
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
      sortBy: 'username' as const,
      sortOrder: 'asc' as const,
    }),
    [page, pageSize, search, activeFilter],
  );

  const list = useUsersList(listQuery);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deactivateMutation = useDeactivateUser();
  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<AppUser> = [
    {
      title: USERS_LABELS.status,
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: (isActive: boolean) => <ActiveStatusTag isActive={isActive} />,
    },
    {
      title: USERS_LABELS.fullName,
      dataIndex: 'fullName',
      key: 'fullName',
      render: (value: string, row) => (
        <Space wrap size={6}>
          <Text strong>{value}</Text>
          {row.isSuperAdmin ? (
            <Tag color="gold">{USERS_LABELS.roleBadge}</Tag>
          ) : null}
        </Space>
      ),
    },
    {
      title: USERS_LABELS.username,
      dataIndex: 'username',
      key: 'username',
      width: 160,
      render: (value: string) => <CodeText value={value} />,
    },
    {
      title: USERS_LABELS.actions,
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={phIcon(PencilSimple, { size: ICON_SIZE.sm })}
            onClick={() => openEdit(record)}
          >
            {USERS_LABELS.editAction}
          </Button>
          {record.isActive ? (
            record.isSuperAdmin ? null : (
            <Button
              type="text"
              size="small"
              danger
              icon={phIcon(Prohibit, { size: ICON_SIZE.sm })}
              onClick={() => confirmDeactivate(record)}
            >
              {USERS_LABELS.deactivate}
            </Button>
            )
          ) : (
            <Button
              type="text"
              size="small"
              icon={phIcon(Power, { size: ICON_SIZE.sm })}
              onClick={() => confirmActivate(record)}
            >
              {USERS_LABELS.activate}
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

  function openEdit(user: AppUser) {
    setFormError(undefined);
    setFormMode({ kind: 'edit', user });
  }

  function closeForm() {
    setFormMode({ kind: 'closed' });
    setFormError(undefined);
  }

  async function handleCreate(values: CreateUserFormValues) {
    setFormError(undefined);
    try {
      await createMutation.mutateAsync({
        fullName: values.fullName.trim(),
        username: values.username.trim(),
        password: values.password,
      });
      message.success(USERS_LABELS.createSuccess);
      closeForm();
    } catch (error) {
      setFormError(mapApiError(error).userMessage);
    }
  }

  async function handleEdit(values: EditUserFormValues) {
    if (formMode.kind !== 'edit') return;
    setFormError(undefined);
    const password = values.password?.trim();
    try {
      await updateMutation.mutateAsync({
        id: formMode.user.id,
        input: {
          fullName: values.fullName.trim(),
          username: values.username.trim(),
          ...(password ? { password } : {}),
        },
      });
      message.success(USERS_LABELS.updateSuccess);
      closeForm();
    } catch (error) {
      setFormError(mapApiError(error).userMessage);
    }
  }

  function confirmDeactivate(user: AppUser) {
    if (user.isSuperAdmin) {
      message.warning(USERS_LABELS.cannotDeactivateSuperAdmin);
      return;
    }
    Modal.confirm({
      title: USERS_LABELS.deactivateConfirm,
      okText: USERS_LABELS.confirm,
      cancelText: USERS_LABELS.cancel,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deactivateMutation.mutateAsync(user.id);
          message.success(USERS_LABELS.deactivateSuccess);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
        }
      },
    });
  }

  function confirmActivate(user: AppUser) {
    Modal.confirm({
      title: USERS_LABELS.activateConfirm,
      okText: USERS_LABELS.confirm,
      cancelText: USERS_LABELS.cancel,
      onOk: async () => {
        try {
          await updateMutation.mutateAsync({
            id: user.id,
            input: { isActive: true },
          });
          message.success(USERS_LABELS.activateSuccess);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
        }
      },
    });
  }

  const listError = list.isError ? mapApiError(list.error).userMessage : undefined;
  const rows = list.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title={USERS_LABELS.title}
        description={USERS_LABELS.description}
        icon={phIcon(UsersThree, { size: ICON_SIZE.xl, weight: 'duotone' })}
        extra={
          <Button
            type="primary"
            icon={phIcon(Plus, { size: ICON_SIZE.md })}
            onClick={openCreate}
          >
            {USERS_LABELS.create}
          </Button>
        }
      />

      <FilterBar>
        <FilterField label={USERS_LABELS.search}>
          <Input.Search
            allowClear
            placeholder={USERS_LABELS.searchPlaceholder}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => {
              setSearch(value.trim());
              setPage(1);
            }}
          />
        </FilterField>
        <FilterField label={USERS_LABELS.status}>
          <ActiveStatusFilter
            value={activeFilter}
            onChange={(value) => {
              setActiveFilter(value);
              setPage(1);
            }}
          />
        </FilterField>
      </FilterBar>

      {listError ? (
        <Alert
          type="error"
          showIcon
          message={listError}
          action={
            <Button size="small" onClick={() => void list.refetch()}>
              {USERS_LABELS.retry}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {isDesktop ? (
        <Table
          rowKey="id"
          size="small"
          loading={list.isLoading}
          columns={columns}
          dataSource={rows}
          pagination={false}
          locale={{ emptyText: USERS_LABELS.empty }}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {rows.map((user) => (
            <Card key={user.id} size="small">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space wrap>
                  <Text strong>{user.fullName}</Text>
                  <ActiveStatusTag isActive={user.isActive} />
                  {user.isSuperAdmin ? (
                    <Tag color="gold">{USERS_LABELS.roleBadge}</Tag>
                  ) : null}
                </Space>
                <CodeText value={user.username} />
                <Space wrap>
                  <Button
                    size="small"
                    icon={phIcon(PencilSimple, { size: ICON_SIZE.sm })}
                    onClick={() => openEdit(user)}
                  >
                    {USERS_LABELS.editAction}
                  </Button>
                  {user.isActive ? (
                    user.isSuperAdmin ? null : (
                    <Button
                      size="small"
                      danger
                      icon={phIcon(Prohibit, { size: ICON_SIZE.sm })}
                      onClick={() => confirmDeactivate(user)}
                    >
                      {USERS_LABELS.deactivate}
                    </Button>
                    )
                  ) : (
                    <Button
                      size="small"
                      icon={phIcon(Power, { size: ICON_SIZE.sm })}
                      onClick={() => confirmActivate(user)}
                    >
                      {USERS_LABELS.activate}
                    </Button>
                  )}
                </Space>
              </Space>
            </Card>
          ))}
          {!list.isLoading && rows.length === 0 ? (
            <Card size="small">
              <Text type="secondary">{USERS_LABELS.empty}</Text>
            </Card>
          ) : null}
        </Space>
      )}

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={list.data?.meta.total ?? 0}
          showSizeChanger
          onChange={(nextPage, nextSize) => {
            setPage(nextPage);
            setPageSize(nextSize);
          }}
        />
      </div>

      <CreateUserFormModal
        open={formMode.kind === 'create'}
        submitting={submitting}
        errorMessage={formError}
        onCancel={closeForm}
        onSubmit={handleCreate}
      />
      <EditUserFormModal
        open={formMode.kind === 'edit'}
        submitting={submitting}
        errorMessage={formError}
        initialValues={
          formMode.kind === 'edit'
            ? {
                fullName: formMode.user.fullName,
                username: formMode.user.username,
                password: '',
              }
            : { fullName: '', username: '', password: '' }
        }
        onCancel={closeForm}
        onSubmit={handleEdit}
      />
    </div>
  );
}
