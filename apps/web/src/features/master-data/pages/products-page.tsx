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
  Select,
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
  Barcode,
  DotsThreeVertical,
  FunnelSimple,
  Package,
  PencilSimple,
  Plus,
  Power,
  Prohibit,
} from "@phosphor-icons/react";
import { mapApiError } from "../../../api/map-api-error";
import { formatMoney } from "../../../shared/money/format-money";
import { formatQuantity } from "../../../shared/ui/format";
import { ICON_SIZE, phIcon } from "../../../shared/ui/ph-icon";
import {
  CodeText,
  EntityCell,
  MoneyCell,
} from "../../../shared/ui/table-cells";
import type { Product, ProductType } from "../api/products.api";
import {
  useCreateProduct,
  useDeactivateProduct,
  useProductsList,
  useUpdateProduct,
} from "../api/products.hooks";
import { useProductCategoriesList } from "../api/product-categories.hooks";
import type { ProductFormValues } from "../forms/product.schemas";
import { ActiveStatusTag } from "../ui/active-status-tag";
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from "../ui/active-filter";
import { MASTER_DATA_LABELS, productTypeLabel } from "../ui/labels";
import { ActiveStatusFilter, FilterBar, FilterField } from "../ui/list-toolbar";
import { PageHeader } from "../ui/page-header";
import { ProductFormModal } from "../ui/product-form-modal";
import "./products-page.css";

const { Text } = Typography;

type FormMode =
  { kind: "closed" } | { kind: "create" } | { kind: "edit"; product: Product };

type TypeFilterValue = "all" | ProductType;

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

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
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
      type: typeFilter === "all" ? undefined : typeFilter,
      categoryId: categoryFilter === "all" ? undefined : categoryFilter,
      sortBy: "code",
      sortOrder: "asc" as const,
    }),
    [page, pageSize, search, activeFilter, typeFilter, categoryFilter],
  );

  const list = useProductsList(listQuery);
  const categoriesForFilter = useProductCategoriesList({
    pageSize: 100,
    sortBy: "name",
    sortOrder: "asc",
  });
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deactivateMutation = useDeactivateProduct();
  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<Product> = [
    {
      title: common.status,
      dataIndex: "isActive",
      key: "isActive",
      width: 110,
      render: (isActive: boolean) => <ActiveStatusTag isActive={isActive} />,
    },
    {
      title: labels.productCode,
      dataIndex: "code",
      key: "code",
      width: 110,
      sorter: true,
      render: (value: string) => <CodeText value={value} />,
    },
    {
      title: labels.productName,
      dataIndex: "name",
      key: "name",
      sorter: true,
      ellipsis: true,
      render: (value: string, record) => (
        <EntityCell
          name={value}
          secondary={record.category?.name ?? undefined}
        />
      ),
    },
    {
      title: labels.type,
      dataIndex: "type",
      key: "type",
      width: 140,
      render: (type: ProductType) => (
        <Tag style={{ marginInlineEnd: 0 }}>{productTypeLabel(type)}</Tag>
      ),
    },
    {
      title: labels.unit,
      key: "unit",
      width: 130,
      render: (_, record) => (
        <Text type="secondary">
          {record.unit.code} · {record.unit.name}
        </Text>
      ),
    },
    {
      title: labels.currentQuantity,
      dataIndex: "currentQuantity",
      key: "currentQuantity",
      width: 120,
      align: "right",
      render: (value: string) => (
        <Text strong style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatQuantity(value)}
        </Text>
      ),
    },
    {
      title: labels.standardSalePrice,
      dataIndex: "standardSalePrice",
      key: "standardSalePrice",
      width: 130,
      align: "right",
      render: (value: string | null) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: labels.latestPurchasePrice,
      dataIndex: "latestPurchasePrice",
      key: "latestPurchasePrice",
      width: 130,
      align: "right",
      render: (value: string | null) => (
        <MoneyCell value={value} format={formatMoney} />
      ),
    },
    {
      title: labels.criticalStockThreshold,
      dataIndex: "criticalStockThreshold",
      key: "criticalStockThreshold",
      width: 135,
      align: "right",
      render: (value: string | null) => (value ? formatQuantity(value) : "—"),
    },
    {
      title: common.actions,
      key: "actions",
      fixed: "right",
      width: 120,
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
                className="products-row-menu"
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

  function openEdit(product: Product) {
    setFormError(undefined);
    setFormMode({ kind: "edit", product });
  }

  function closeForm() {
    setFormMode({ kind: "closed" });
    setFormError(undefined);
  }

  async function handleSubmit(values: ProductFormValues) {
    setFormError(undefined);
    const categoryId = emptyToNull(values.categoryId ?? "");

    try {
      if (formMode.kind === "create") {
        await createMutation.mutateAsync({
          name: values.name.trim(),
          type: values.type,
          categoryId,
          unitId: values.unitId,
          standardSalePrice: emptyToUndefined(values.standardSalePrice),
          latestPurchasePrice: emptyToUndefined(values.latestPurchasePrice),
          criticalStockThreshold: emptyToUndefined(
            values.criticalStockThreshold,
          ),
          barcode: emptyToUndefined(values.barcode),
          notes: emptyToUndefined(values.notes),
        });
        message.success(common.createSuccess);
      } else if (formMode.kind === "edit") {
        await updateMutation.mutateAsync({
          id: formMode.product.id,
          input: {
            name: values.name.trim(),
            type: values.type,
            categoryId,
            unitId: values.unitId,
            standardSalePrice: emptyToNull(values.standardSalePrice),
            latestPurchasePrice: emptyToNull(values.latestPurchasePrice),
            criticalStockThreshold: emptyToNull(values.criticalStockThreshold),
            barcode: emptyToNull(values.barcode),
            notes: emptyToNull(values.notes),
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
      className: "app-mobile-modal products-confirm-modal",
      centered: true,
      title: labels.deactivateConfirm,
      content: (
        <div className="products-confirm-product">
          <CodeText value={product.code} />
          <Text strong>{product.name}</Text>
        </div>
      ),
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

  function confirmActivate(product: Product) {
    Modal.confirm({
      className: "app-mobile-modal products-confirm-modal",
      centered: true,
      title: labels.activateConfirm,
      content: (
        <div className="products-confirm-product">
          <CodeText value={product.code} />
          <Text strong>{product.name}</Text>
        </div>
      ),
      okText: common.confirm,
      cancelText: common.cancel,
      onOk: async () => {
        try {
          await updateMutation.mutateAsync({
            id: product.id,
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

  const editInitialValues: ProductFormValues | undefined =
    formMode.kind === "edit"
      ? {
          name: formMode.product.name,
          type: formMode.product.type,
          categoryId: formMode.product.categoryId ?? "",
          unitId: formMode.product.unitId,
          standardSalePrice: formMode.product.standardSalePrice ?? "",
          latestPurchasePrice: formMode.product.latestPurchasePrice ?? "",
          criticalStockThreshold: formMode.product.criticalStockThreshold ?? "",
          barcode: formMode.product.barcode ?? "",
          notes: formMode.product.notes ?? "",
        }
      : undefined;

  const fallbackUnitOption =
    formMode.kind === "edit"
      ? {
          value: formMode.product.unitId,
          label: `${formMode.product.unit.code} — ${formMode.product.unit.name}`,
        }
      : undefined;

  const fallbackCategoryOption =
    formMode.kind === "edit" && formMode.product.category
      ? {
          value: formMode.product.category.id,
          label: formMode.product.category.name,
        }
      : undefined;

  const typeFilterOptions = [
    { value: "all" as const, label: common.all },
    ...(Object.keys(labels.types) as ProductType[]).map((type) => ({
      value: type,
      label: productTypeLabel(type),
    })),
  ];

  const categoryFilterOptions = [
    { value: "all", label: common.all },
    ...(categoriesForFilter.data?.data ?? []).map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];
  const products = list.data?.data ?? [];
  const productTotal = list.data?.meta.total ?? 0;

  return (
    <div className="products-page">
      <PageHeader
        title={labels.title}
        description={labels.description}
        icon={phIcon(Package, { size: ICON_SIZE.xl, weight: "duotone" })}
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

      <Card className="products-filter-card" size="small">
        <div className="products-filter-heading">
          <div>
            <span className="products-filter-icon">
              {phIcon(FunnelSimple, { size: ICON_SIZE.sm, weight: "bold" })}
            </span>
            <Text strong>{common.search}</Text>
          </div>
          <Tag color="blue">{productTotal}</Tag>
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
            setTypeFilter("all");
            setCategoryFilter("all");
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
          <FilterField label={labels.filterType}>
            <Select
              value={typeFilter}
              onChange={(value: TypeFilterValue) => {
                setTypeFilter(value);
                setPage(1);
              }}
              aria-label={labels.filterType}
              options={typeFilterOptions}
            />
          </FilterField>
          <FilterField label={labels.filterCategory}>
            <Select
              value={categoryFilter}
              onChange={(value: string) => {
                setCategoryFilter(value);
                setPage(1);
              }}
              showSearch
              optionFilterProp="label"
              aria-label={labels.filterCategory}
              options={categoryFilterOptions}
            />
          </FilterField>
        </FilterBar>
      </Card>

      {list.isError ? (
        <Alert
          className="products-alert"
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
        <div className="products-table-shell">
          <Table<Product>
            className="products-table"
            rowKey="id"
            loading={list.isLoading}
            columns={columns}
            dataSource={products}
            pagination={false}
            locale={{ emptyText: labels.empty }}
            scroll={{ x: 1240 }}
          />
        </div>
      ) : (
        <div className="products-mobile-list">
          {list.isLoading ? (
            <Card className="product-mobile-card">
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          ) : null}
          {!list.isLoading && products.length === 0 ? (
            <Card className="products-empty-card">
              <Empty description={labels.empty} />
            </Card>
          ) : null}
          {products.map((product) => (
            <Card
              className={`product-mobile-card${
                product.isActive ? "" : " is-inactive"
              }`}
              key={product.id}
              size="small"
            >
              <div className="product-mobile-topline">
                <div className="product-mobile-identity">
                  <div className="product-mobile-identity-field">
                    <CodeText value={product.code} />
                  </div>
                  <div className="product-mobile-identity-field">
                    <Text strong className="product-mobile-name">
                      {product.name}
                    </Text>
                  </div>
                </div>
                <div className="product-mobile-head-actions">
                  <ActiveStatusTag isActive={product.isActive} />
                  <Button
                    type="text"
                    icon={phIcon(PencilSimple, { size: ICON_SIZE.sm })}
                    aria-label={common.edit}
                    onClick={() => openEdit(product)}
                  />
                  {product.isActive ? (
                    <Button
                      type="text"
                      danger
                      icon={phIcon(Prohibit, { size: ICON_SIZE.sm })}
                      aria-label={common.deactivate}
                      onClick={() => confirmDeactivate(product)}
                    />
                  ) : (
                    <Button
                      type="text"
                      icon={phIcon(Power, { size: ICON_SIZE.sm })}
                      aria-label={common.activate}
                      onClick={() => confirmActivate(product)}
                    />
                  )}
                </div>
              </div>

              <div className="product-mobile-tags">
                <Tag color="blue">{productTypeLabel(product.type)}</Tag>
                {product.category ? <Tag>{product.category.name}</Tag> : null}
              </div>

              <div className="product-mobile-primary">
                <div>
                  <Text type="secondary">{labels.currentQuantity}</Text>
                  <strong>{formatQuantity(product.currentQuantity)}</strong>
                </div>
                <div>
                  <Text type="secondary">{labels.standardSalePrice}</Text>
                  <strong>
                    {product.standardSalePrice
                      ? formatMoney(product.standardSalePrice)
                      : "—"}
                  </strong>
                </div>
              </div>

              <div className="product-mobile-details">
                <div>
                  <Text type="secondary">{labels.unit}</Text>
                  <strong>
                    {product.unit.code} — {product.unit.name}
                  </strong>
                </div>
                <div>
                  <Text type="secondary">{labels.latestPurchasePrice}</Text>
                  <strong>
                    {product.latestPurchasePrice
                      ? formatMoney(product.latestPurchasePrice)
                      : "—"}
                  </strong>
                </div>
                <div>
                  <Text type="secondary">{labels.criticalStockThreshold}</Text>
                  <strong>
                    {product.criticalStockThreshold
                      ? formatQuantity(product.criticalStockThreshold)
                      : "—"}
                  </strong>
                </div>
                {product.barcode ? (
                  <div>
                    <Text type="secondary">{labels.barcode}</Text>
                    <strong className="product-mobile-barcode">
                      {phIcon(Barcode, { size: ICON_SIZE.sm })}
                      {product.barcode}
                    </strong>
                  </div>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      {productTotal > 0 ? (
        <div className="products-pagination">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={productTotal}
            showSizeChanger
            responsive
            onChange={(nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            }}
          />
        </div>
      ) : null}

      <ProductFormModal
        open={formMode.kind !== "closed"}
        title={formMode.kind === "edit" ? labels.edit : labels.create}
        mode={formMode.kind === "edit" ? "edit" : "create"}
        readOnlyCode={
          formMode.kind === "edit" ? formMode.product.code : undefined
        }
        fallbackUnitOption={fallbackUnitOption}
        fallbackCategoryOption={fallbackCategoryOption}
        initialValues={editInitialValues}
        submitting={submitting}
        errorMessage={formError}
        onCancel={closeForm}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
