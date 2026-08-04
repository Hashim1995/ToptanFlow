import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Dropdown,
  Empty,
  Grid,
  Input,
  Pagination,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { confirmWithoutAutofocus } from "../../../shared/ui/confirm-without-autofocus";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
  DotsThreeVertical,
  FunnelSimple,
  PencilSimple,
  Plus,
  Power,
  Prohibit,
  Ruler,
} from "@phosphor-icons/react";
import { mapApiError } from "../../../api/map-api-error";
import { ICON_SIZE, phIcon } from "../../../shared/ui/ph-icon";
import { CodeText } from "../../../shared/ui/table-cells";
import type { Unit } from "../api/units.api";
import {
  useCreateUnit,
  useDeactivateUnit,
  useUnitsList,
  useUpdateUnit,
} from "../api/units.hooks";
import type { UnitFormValues } from "../forms/reference-data.schemas";
import { ActiveStatusTag } from "../ui/active-status-tag";
import {
  activeFilterToIsActive,
  type ActiveFilterValue,
} from "../ui/active-filter";
import { MASTER_DATA_LABELS } from "../ui/labels";
import { ActiveStatusFilter, FilterBar, FilterField } from "../ui/list-toolbar";
import { PageHeader } from "../ui/page-header";
import { UnitFormModal } from "../ui/reference-form-modals";
import "./reference-data-pages.css";

const { Text } = Typography;

type FormMode =
  { kind: "closed" } | { kind: "create" } | { kind: "edit"; unit: Unit };

export function UnitsPage() {
  const labels = MASTER_DATA_LABELS.units;
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
      sortBy: "code",
      sortOrder: "asc" as const,
    }),
    [page, pageSize, search, activeFilter],
  );

  const list = useUnitsList(listQuery);
  const createMutation = useCreateUnit();
  const updateMutation = useUpdateUnit();
  const deactivateMutation = useDeactivateUnit();

  const submitting = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnsType<Unit> = [
    {
      title: common.status,
      dataIndex: "isActive",
      key: "isActive",
      width: 110,
      render: (isActive: boolean) => <ActiveStatusTag isActive={isActive} />,
    },
    {
      title: common.code,
      dataIndex: "code",
      key: "code",
      width: 120,
      render: (value: string) => <CodeText value={value} />,
    },
    {
      title: common.name,
      dataIndex: "name",
      key: "name",
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: common.fractional,
      dataIndex: "allowsFractionalQuantity",
      key: "allowsFractionalQuantity",
      width: 140,
      render: (value: boolean) => (
        <Tag color={value ? "blue" : "default"} style={{ marginInlineEnd: 0 }}>
          {value ? common.yes : common.no}
        </Tag>
      ),
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

  function openEdit(unit: Unit) {
    setFormError(undefined);
    setFormMode({ kind: "edit", unit });
  }

  function closeForm() {
    setFormMode({ kind: "closed" });
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
      if (formMode.kind === "create") {
        await createMutation.mutateAsync(payload);
        message.success(common.createSuccess);
      } else if (formMode.kind === "edit") {
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
    confirmWithoutAutofocus({
      className: "app-mobile-modal reference-confirm-modal",
      centered: true,
      title: labels.deactivateConfirm,
      content: (
        <div className="reference-confirm-entity">
          <CodeText value={unit.code} />
          <Text strong>{unit.name}</Text>
        </div>
      ),
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
    confirmWithoutAutofocus({
      className: "app-mobile-modal reference-confirm-modal",
      centered: true,
      title: labels.activateConfirm,
      content: (
        <div className="reference-confirm-entity">
          <CodeText value={unit.code} />
          <Text strong>{unit.name}</Text>
        </div>
      ),
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
    formMode.kind === "edit"
      ? {
          code: formMode.unit.code,
          name: formMode.unit.name,
          allowsFractionalQuantity: formMode.unit.allowsFractionalQuantity,
        }
      : undefined;
  const units = list.data?.data ?? [];
  const unitTotal = list.data?.meta.total ?? 0;

  return (
    <div className="reference-page units-page">
      <PageHeader
        title={labels.title}
        description={labels.description}
        icon={phIcon(Ruler, { size: ICON_SIZE.xl, weight: "duotone" })}
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
            {unitTotal}
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
          <Table<Unit>
            className="reference-table"
            rowKey="id"
            loading={list.isLoading}
            columns={columns}
            dataSource={units}
            pagination={false}
            locale={{ emptyText: labels.empty }}
          />
        </div>
      ) : (
        <div className="reference-mobile-list">
          {list.isLoading ? (
            <Card className="reference-mobile-card">
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
          ) : null}
          {!list.isLoading && units.length === 0 ? (
            <Card className="reference-empty-card">
              <Empty description={labels.empty} />
            </Card>
          ) : null}
          {units.map((unit) => (
            <Card
              className={`reference-mobile-card${
                unit.isActive ? "" : " is-inactive"
              }`}
              key={unit.id}
              size="small"
            >
              <div className="reference-mobile-topline">
                <div className="reference-mobile-name">
                  <CodeText value={unit.code} />
                  <Text strong>{unit.name}</Text>
                </div>
                <ActiveStatusTag isActive={unit.isActive} />
              </div>
              <div className="reference-mobile-property">
                <Text type="secondary">{common.fractional}</Text>
                <Tag color={unit.allowsFractionalQuantity ? "blue" : "default"}>
                  {unit.allowsFractionalQuantity ? common.yes : common.no}
                </Tag>
              </div>
              <div className="reference-mobile-actions">
                <Button
                  icon={phIcon(PencilSimple, { size: ICON_SIZE.sm })}
                  onClick={() => openEdit(unit)}
                >
                  {common.edit}
                </Button>
                {unit.isActive ? (
                  <Button
                    danger
                    icon={phIcon(Prohibit, { size: ICON_SIZE.sm })}
                    onClick={() => confirmDeactivate(unit)}
                  >
                    {common.deactivate}
                  </Button>
                ) : (
                  <Button
                    icon={phIcon(Power, { size: ICON_SIZE.sm })}
                    onClick={() => confirmActivate(unit)}
                  >
                    {common.activate}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {unitTotal > 0 ? (
        <div className="reference-pagination">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={unitTotal}
            showSizeChanger
            responsive
            onChange={(nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            }}
          />
        </div>
      ) : null}

      <UnitFormModal
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
