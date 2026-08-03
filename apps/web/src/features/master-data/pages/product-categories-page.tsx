import { useMemo, useState } from "react";
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
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
  DotsThreeVertical,
  FunnelSimple,
  PencilSimple,
  Plus,
  Power,
  Prohibit,
  SquaresFour,
} from "@phosphor-icons/react";
import { mapApiError } from "../../../api/map-api-error";
import { ICON_SIZE, phIcon } from "../../../shared/ui/ph-icon";
import type { ProductCategory } from "../api/product-categories.api";
import {
  useCreateProductCategory,
  useDeactivateProductCategory,
  useProductCategoriesList,
  useUpdateProductCategory,
} from "../api/product-categories.hooks";
import type { ProductCategoryFormValues } from "../forms/reference-data.schemas";
import { ActiveStatusTag } from "../ui/active-status-tag";
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from "../ui/active-filter";
import { MASTER_DATA_LABELS } from "../ui/labels";
import { ActiveStatusFilter, FilterBar, FilterField } from "../ui/list-toolbar";
import { PageHeader } from "../ui/page-header";
import { ProductCategoryFormModal } from "../ui/reference-form-modals";
import "./reference-data-pages.css";

const { Text } = Typography;

type FormMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; category: ProductCategory };

export function ProductCategoriesPage() {
  const labels = MASTER_DATA_LABELS.categories;
  const common = MASTER_DATA_LABELS.common;
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [formMode, setFormMode] = useState<FormMode>({ kind: "closed" });
  const [formError, setFormError] = useState<string | undefined>();

  const listQuery = useMemo(
    () => ({
      page,
      pageSize,
      search: search || undefined,
      isActive: activeFilterToIsActive(activeFilter),
      sortBy: "name",
      sortOrder: "asc" as const,
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
      dataIndex: "isActive",
      key: "isActive",
      width: 110,
      render: (isActive: boolean) => <ActiveStatusTag isActive={isActive} />,
    },
    {
      title: common.name,
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: common.actions,
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "edit",
            icon: phIcon(PencilSimple, { size: ICON_SIZE.sm }),
            label: common.edit,
            onClick: () => openEdit(record),
          },
          { type: "divider" },
          record.isActive
            ? {
                key: "deactivate",
                danger: true,
                icon: phIcon(Prohibit, { size: ICON_SIZE.sm }),
                label: common.deactivate,
                onClick: () => confirmDeactivate(record),
              }
            : {
                key: "activate",
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
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button
                className="reference-row-menu"
                type="text"
                size="small"
                icon={phIcon(DotsThreeVertical, {
                  size: ICON_SIZE.md,
                  weight: "bold",
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
    setFormMode({ kind: "create" });
  }

  function openEdit(category: ProductCategory) {
    setFormError(undefined);
    setFormMode({ kind: "edit", category });
  }

  function closeForm() {
    setFormMode({ kind: "closed" });
    setFormError(undefined);
  }

  async function handleSubmit(values: ProductCategoryFormValues) {
    setFormError(undefined);
    const payload = { name: values.name.trim() };

    try {
      if (formMode.kind === "create") {
        await createMutation.mutateAsync(payload);
        message.success(common.createSuccess);
      } else if (formMode.kind === "edit") {
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
      className: "app-mobile-modal reference-confirm-modal",
      centered: true,
      title: labels.deactivateConfirm,
      content: <Text strong>{category.name}</Text>,
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
      className: "app-mobile-modal reference-confirm-modal",
      centered: true,
      title: labels.activateConfirm,
      content: <Text strong>{category.name}</Text>,
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
    formMode.kind === "edit" ? { name: formMode.category.name } : undefined;
  const categories = list.data?.data ?? [];
  const categoryTotal = list.data?.meta.total ?? 0;

  return (
    <div className="reference-page categories-page">
      <PageHeader
        title={labels.title}
        description={labels.description}
        icon={phIcon(SquaresFour, { size: ICON_SIZE.xl, weight: "duotone" })}
        extra={
          <Button
            type="primary"
            icon={phIcon(Plus, { size: ICON_SIZE.md, weight: "bold" })}
            onClick={openCreate}
          >
            {labels.create}
          </Button>
        }
      />

      <Card className="reference-filter-card" size="small">
        <div className="reference-filter-heading">
          <div>
            <span className="reference-filter-icon">
              {phIcon(FunnelSimple, { size: ICON_SIZE.sm, weight: "bold" })}
            </span>
            <Text strong>{common.search}</Text>
          </div>
          <Tag className="reference-result-count" color="blue">
            {categoryTotal}
          </Tag>
        </div>
        <FilterBar
          onSearch={() => {
            setSearch(searchInput.trim());
            setPage(1);
          }}
          onReset={() => {
            setSearchInput("");
            setSearch("");
            setActiveFilter("all");
            setPage(1);
          }}
        >
          <FilterField label={common.search}>
            <Input
              allowClear
              placeholder={common.searchPlaceholder}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onPressEnter={() => {
                setSearch(searchInput.trim());
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
        </FilterBar>
      </Card>

      {list.isError ? (
        <Alert
          className="reference-page-alert"
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
        <div className="reference-table-shell">
          <Table<ProductCategory>
            className="reference-table"
            rowKey="id"
            loading={list.isLoading}
            columns={columns}
            dataSource={categories}
            pagination={false}
            locale={{ emptyText: labels.empty }}
          />
        </div>
      ) : (
        <div className="reference-mobile-list">
          {list.isLoading ? (
            <Card className="reference-mobile-card">
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          ) : null}
          {!list.isLoading && categories.length === 0 ? (
            <Card className="reference-empty-card">
              <Empty description={labels.empty} />
            </Card>
          ) : null}
          {categories.map((category) => (
            <Card
              className={`reference-mobile-card${
                category.isActive ? "" : " is-inactive"
              }`}
              key={category.id}
              size="small"
            >
              <div className="reference-mobile-topline">
                <div className="reference-mobile-name">
                  <Text type="secondary">{common.name}</Text>
                  <Text strong>{category.name}</Text>
                </div>
                <ActiveStatusTag isActive={category.isActive} />
              </div>
              <div className="reference-mobile-actions">
                <Button
                  icon={phIcon(PencilSimple, { size: ICON_SIZE.sm })}
                  onClick={() => openEdit(category)}
                >
                  {common.edit}
                </Button>
                {category.isActive ? (
                  <Button
                    danger
                    icon={phIcon(Prohibit, { size: ICON_SIZE.sm })}
                    onClick={() => confirmDeactivate(category)}
                  >
                    {common.deactivate}
                  </Button>
                ) : (
                  <Button
                    icon={phIcon(Power, { size: ICON_SIZE.sm })}
                    onClick={() => confirmActivate(category)}
                  >
                    {common.activate}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {categoryTotal > 0 ? (
        <div className="reference-pagination">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={categoryTotal}
            showSizeChanger
            responsive
            onChange={(nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            }}
          />
        </div>
      ) : null}

      <ProductCategoryFormModal
        open={formMode.kind !== "closed"}
        title={formMode.kind === "edit" ? labels.edit : labels.create}
        initialValues={editInitialValues}
        submitting={submitting}
        errorMessage={formError}
        onCancel={closeForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
