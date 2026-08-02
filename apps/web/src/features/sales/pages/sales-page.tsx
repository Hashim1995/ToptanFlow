import { useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  DatePicker,
  Dropdown,
  Grid,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import type { MenuProps, TableProps } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import {
  DATE_DISPLAY_FORMAT,
  dateOnlyPickerToApi,
} from "../../../shared/datetime";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowCounterClockwise,
  CalendarBlank,
  CheckCircle,
  DotsThreeVertical,
  Eye,
  Funnel,
  Package,
  PencilSimple,
  Plus,
  ShoppingBag,
  Trash,
  User,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import { mapApiError } from "../../../api/map-api-error";
import { formatMoney } from "../../../shared/money/format-money";
import { formatDateTime } from "../../../shared/ui/format";
import { phIcon, ICON_SIZE } from "../../../shared/ui/ph-icon";
import {
  CodeText,
  EntityCell,
  MoneyCell,
} from "../../../shared/ui/table-cells";
import { useBusinessPartnersList } from "../../master-data/api/business-partners.hooks";
import { useProductsList } from "../../master-data/api/products.hooks";
import { DecimalInput } from "../../master-data/ui/decimal-input";
import { FilterBar, FilterField } from "../../master-data/ui/list-toolbar";
import { PageHeader } from "../../master-data/ui/page-header";
import type { SaleListItem, SaleSortBy, SaleStatus } from "../api/sales.api";
import {
  useCancelSale,
  usePostSale,
  useRemoveSale,
  useSale,
  useSalesList,
} from "../api/sales.hooks";
import { SaleFormModal } from "../ui/sale-form-modal";
import { SALES_LABELS, saleStatusLabel } from "../ui/labels";
import { computeQuantityShortages } from "../ui/quantity-shortage";
import { SalePostConfirmModal } from "../ui/sale-post-confirm-modal";
import "../../../shared/ui/commercial-documents.css";

const { Text } = Typography;

function partnerName(record: SaleListItem) {
  return record.partnerName ?? record.partner?.name ?? "—";
}

function partnerCode(record: SaleListItem) {
  return record.partnerCode ?? record.partner?.code ?? "";
}

function createdByName(record: SaleListItem) {
  return record.createdByName ?? record.createdBy?.fullName ?? "—";
}

function statusColor(status: SaleStatus) {
  return status === "POSTED"
    ? "success"
    : status === "CANCELLED"
      ? "error"
      : "warning";
}

function StatusBadge({ status }: { status: SaleStatus }) {
  return (
    <Tag color={statusColor(status)} style={{ marginInlineEnd: 0 }}>
      {saleStatusLabel(status)}
    </Tag>
  );
}

export function SalesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [documentInput, setDocumentInput] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [partnerId, setPartnerId] = useState<string>();
  const [status, setStatus] = useState<SaleStatus>();
  const [dateRange, setDateRange] = useState<[string, string]>();
  const [productId, setProductId] = useState<string>();
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [sortBy, setSortBy] = useState<SaleSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [cancelTarget, setCancelTarget] = useState<SaleListItem>();
  const [cancelReason, setCancelReason] = useState("");
  const [postTarget, setPostTarget] = useState<SaleListItem>();
  const [formMode, setFormMode] = useState<
    { kind: "closed" } | { kind: "create" } | { kind: "edit"; saleId: string }
  >(() =>
    searchParams.get("action") === "create"
      ? { kind: "create" }
      : { kind: "closed" },
  );

  const query = useMemo(
    () => ({
      page,
      pageSize,
      documentNumber: documentNumber || undefined,
      partnerId,
      status,
      businessDateFrom: dateRange?.[0],
      businessDateTo: dateRange?.[1],
      productId,
      minTotal: minTotal || undefined,
      maxTotal: maxTotal || undefined,
      sortBy,
      sortOrder,
    }),
    [
      page,
      pageSize,
      documentNumber,
      partnerId,
      status,
      dateRange,
      productId,
      minTotal,
      maxTotal,
      sortBy,
      sortOrder,
    ],
  );
  const list = useSalesList(query);
  const partners = useBusinessPartnersList({
    pageSize: 100,
    isCustomer: true,
    sortBy: "name",
    sortOrder: "asc",
  });
  const products = useProductsList({
    pageSize: 100,
    isActive: true,
    sortBy: "name",
    sortOrder: "asc",
  });
  const postMutation = usePostSale();
  const removeMutation = useRemoveSale();
  const cancelMutation = useCancelSale();
  const postTargetDetail = useSale(postTarget?.id);
  const postShortages = useMemo(
    () =>
      postTargetDetail.data
        ? computeQuantityShortages(
            postTargetDetail.data.items,
            products.data?.data ?? [],
          )
        : [],
    [postTargetDetail.data, products.data?.data],
  );

  const partnerOptions = (partners.data?.data ?? [])
    .filter((partner) => partner.isCustomer)
    .map((partner) => ({
      value: partner.id,
      label: `${partner.code} — ${partner.name}`,
    }));
  const productOptions = (products.data?.data ?? []).map((product) => ({
    value: product.id,
    label: `${product.code} — ${product.name}`,
  }));

  const activeFilterCount = [
    documentNumber,
    partnerId,
    status,
    dateRange,
    productId,
    minTotal,
    maxTotal,
  ].filter(Boolean).length;

  function confirmRemove(record: SaleListItem) {
    Modal.confirm({
      className: "app-mobile-modal",
      title: SALES_LABELS.remove.title,
      content: SALES_LABELS.remove.text,
      okText: SALES_LABELS.actions.remove,
      cancelText: SALES_LABELS.actions.back,
      okButtonProps: { danger: true },
      icon: phIcon(WarningCircle, { size: ICON_SIZE.xl, weight: "fill" }),
      onOk: async () => {
        try {
          await removeMutation.mutateAsync(record.id);
          message.success(SALES_LABELS.remove.success);
        } catch (error) {
          message.error(mapApiError(error).userMessage);
          throw error;
        }
      },
    });
  }

  function actionMenu(record: SaleListItem): MenuProps["items"] {
    const items: MenuProps["items"] = [
      {
        key: "view",
        icon: phIcon(Eye, { size: ICON_SIZE.sm }),
        label: SALES_LABELS.actions.view,
        onClick: () => navigate(`/sales/${record.id}`),
      },
    ];
    if (record.status === "DRAFT") {
      items.push(
        {
          key: "edit",
          icon: phIcon(PencilSimple, { size: ICON_SIZE.sm }),
          label: SALES_LABELS.actions.edit,
          onClick: () => setFormMode({ kind: "edit", saleId: record.id }),
        },
        {
          key: "post",
          icon: phIcon(CheckCircle, { size: ICON_SIZE.sm }),
          label: SALES_LABELS.actions.post,
          onClick: () => setPostTarget(record),
        },
        { type: "divider" },
        {
          key: "remove",
          danger: true,
          icon: phIcon(Trash, { size: ICON_SIZE.sm }),
          label: SALES_LABELS.actions.remove,
          onClick: () => confirmRemove(record),
        },
      );
    }
    if (record.status === "POSTED") {
      items.push({
        key: "cancel",
        danger: true,
        icon: phIcon(XCircle, { size: ICON_SIZE.sm }),
        label: SALES_LABELS.actions.cancel,
        onClick: () => setCancelTarget(record),
      });
    }
    return items;
  }

  function actions(record: SaleListItem) {
    return (
      <Space size={4} wrap>
        <Tooltip title={SALES_LABELS.actions.view}>
          <Button
            type="text"
            size="small"
            icon={phIcon(Eye, { size: ICON_SIZE.sm })}
            aria-label={SALES_LABELS.actions.view}
            onClick={() => navigate(`/sales/${record.id}`)}
          />
        </Tooltip>
        {record.status === "DRAFT" ? (
          <>
            <Tooltip title={SALES_LABELS.actions.edit}>
              <Button
                type="text"
                size="small"
                icon={phIcon(PencilSimple, { size: ICON_SIZE.sm })}
                aria-label={SALES_LABELS.actions.edit}
                onClick={() => setFormMode({ kind: "edit", saleId: record.id })}
              />
            </Tooltip>
            <Tooltip title={SALES_LABELS.actions.post}>
              <Button
                type="primary"
                ghost
                size="small"
                icon={phIcon(CheckCircle, { size: ICON_SIZE.sm })}
                aria-label={SALES_LABELS.actions.post}
                onClick={() => setPostTarget(record)}
              />
            </Tooltip>
          </>
        ) : null}
        <Dropdown menu={{ items: actionMenu(record) }} trigger={["click"]}>
          <Button
            className="commercial-row-menu"
            type="text"
            size="small"
            icon={phIcon(DotsThreeVertical, {
              size: ICON_SIZE.md,
              weight: "bold",
            })}
            aria-label={SALES_LABELS.columns.actions}
          />
        </Dropdown>
      </Space>
    );
  }

  function mobileActions(record: SaleListItem) {
    if (record.status !== "DRAFT") return null;
    return (
      <div className="commercial-mobile-actions">
        <Button
          type="text"
          icon={phIcon(Eye, { size: ICON_SIZE.md })}
          aria-label={SALES_LABELS.actions.view}
          onClick={() => navigate(`/sales/${record.id}`)}
        />
        <>
          <Button
            type="text"
            icon={phIcon(PencilSimple, { size: ICON_SIZE.md })}
            aria-label={SALES_LABELS.actions.edit}
            onClick={() => setFormMode({ kind: "edit", saleId: record.id })}
          />
          <Button
            type="text"
            className="is-confirm"
            icon={phIcon(CheckCircle, { size: ICON_SIZE.md })}
            aria-label={SALES_LABELS.actions.post}
            onClick={() => setPostTarget(record)}
          />
          <Button
            type="text"
            danger
            icon={phIcon(Trash, { size: ICON_SIZE.md })}
            aria-label={SALES_LABELS.actions.remove}
            onClick={() => confirmRemove(record)}
          />
        </>
      </div>
    );
  }

  function mobileHeaderActions(record: SaleListItem) {
    if (record.status === "DRAFT") return undefined;
    return (
      <div className="commercial-mobile-header-actions">
        <Button
          type="text"
          icon={phIcon(Eye, { size: ICON_SIZE.sm })}
          aria-label={SALES_LABELS.actions.view}
          onClick={() => navigate(`/sales/${record.id}`)}
        />
        {record.status === "POSTED" ? (
          <Button
            type="text"
            danger
            icon={phIcon(XCircle, { size: ICON_SIZE.sm })}
            aria-label={SALES_LABELS.actions.cancel}
            onClick={() => setCancelTarget(record)}
          />
        ) : null}
      </div>
    );
  }

  const columns: ColumnsType<SaleListItem> = [
    {
      title: SALES_LABELS.columns.status,
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value: SaleStatus) => <StatusBadge status={value} />,
    },
    {
      title: SALES_LABELS.columns.documentNumber,
      dataIndex: "documentNumber",
      key: "documentNumber",
      width: 140,
      sorter: true,
      render: (value: string) => <CodeText value={value} strong />,
    },
    {
      title: SALES_LABELS.columns.businessDate,
      dataIndex: "businessDate",
      key: "businessDate",
      width: 130,
      sorter: true,
      render: (value: string) => (
        <Space size={6}>
          {phIcon(CalendarBlank, { size: ICON_SIZE.sm })}
          <Text>{formatDateTime(value)}</Text>
        </Space>
      ),
    },
    {
      title: SALES_LABELS.columns.partner,
      key: "partner",
      ellipsis: true,
      render: (_, record) => (
        <EntityCell code={partnerCode(record)} name={partnerName(record)} />
      ),
    },
    {
      title: SALES_LABELS.columns.itemCount,
      dataIndex: "itemCount",
      key: "itemCount",
      width: 100,
      align: "center",
      render: (value: number) => (
        <Badge
          count={value}
          showZero
          color="#1677ff"
          overflowCount={999}
          style={{ backgroundColor: "#1677ff" }}
        />
      ),
    },
    {
      title: SALES_LABELS.columns.total,
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 140,
      sorter: true,
      align: "right",
      render: (value: string) => (
        <MoneyCell value={value} format={formatMoney} emphasize />
      ),
    },
    {
      title: SALES_LABELS.columns.createdBy,
      key: "createdBy",
      width: 140,
      ellipsis: true,
      render: (_, record) => (
        <Space size={6}>
          {phIcon(User, { size: ICON_SIZE.sm })}
          <Text ellipsis style={{ maxWidth: 110 }}>
            {createdByName(record)}
          </Text>
        </Space>
      ),
    },
    {
      title: SALES_LABELS.columns.actions,
      key: "actions",
      fixed: "right",
      width: 140,
      render: (_, record) => actions(record),
    },
  ];

  const handleTableChange: TableProps<SaleListItem>["onChange"] = (
    _pagination,
    _filters,
    sorter,
  ) => {
    if (
      !Array.isArray(sorter) &&
      typeof sorter.field === "string" &&
      sorter.order
    ) {
      setSortBy(sorter.field as SaleSortBy);
      setSortOrder(sorter.order === "ascend" ? "asc" : "desc");
      setPage(1);
    }
  };

  return (
    <div className="ui-page ui-list-page ui-document-list-page commercial-documents-page sales-page">
      <PageHeader
        title={SALES_LABELS.title}
        description={SALES_LABELS.description}
        icon={phIcon(ShoppingBag, { size: ICON_SIZE.xl, weight: "duotone" })}
        extra={
          <Button
            type="primary"
            icon={phIcon(Plus, { size: ICON_SIZE.md, weight: "bold" })}
            onClick={() => setFormMode({ kind: "create" })}
          >
            {SALES_LABELS.create}
          </Button>
        }
      />

      <Card
        className="ui-filter-card commercial-filter-card"
        size="small"
        style={{ marginBottom: 16 }}
        title={
          <Space size={8}>
            {phIcon(Funnel, { size: ICON_SIZE.sm })}
            <span>Filtrlər</span>
            {activeFilterCount > 0 ? (
              <Badge count={activeFilterCount} color="#1677ff" />
            ) : null}
          </Space>
        }
      >
        <FilterBar
          onSearch={() => {
            setDocumentNumber(documentInput.trim());
            setPage(1);
          }}
          onReset={() => {
            setDocumentInput("");
            setDocumentNumber("");
            setPartnerId(undefined);
            setStatus(undefined);
            setDateRange(undefined);
            setProductId(undefined);
            setMinTotal("");
            setMaxTotal("");
            setPage(1);
          }}
        >
          <FilterField label={SALES_LABELS.filters.documentNumber}>
            <Input
              allowClear
              value={documentInput}
              placeholder={SALES_LABELS.filters.documentNumberPlaceholder}
              onChange={(event) => setDocumentInput(event.target.value)}
              onPressEnter={() => {
                setDocumentNumber(documentInput.trim());
                setPage(1);
              }}
              style={{ width: 220 }}
            />
          </FilterField>
          <FilterField label={SALES_LABELS.filters.partner}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={partnerId}
              placeholder={SALES_LABELS.fields.partnerPlaceholder}
              options={partnerOptions}
              onChange={(value) => {
                setPartnerId(value);
                setPage(1);
              }}
              style={{ width: 220 }}
            />
          </FilterField>
          <FilterField label={SALES_LABELS.filters.status}>
            <Select
              allowClear
              value={status}
              placeholder={SALES_LABELS.filters.all}
              options={(Object.keys(SALES_LABELS.statuses) as SaleStatus[]).map(
                (value) => ({
                  value,
                  label: saleStatusLabel(value),
                }),
              )}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              style={{ width: 160 }}
            />
          </FilterField>
          <FilterField label={SALES_LABELS.filters.dateRange}>
            <DatePicker.RangePicker
              format={DATE_DISPLAY_FORMAT}
              value={
                dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null
              }
              onChange={(values: null | [Dayjs | null, Dayjs | null]) => {
                setDateRange(
                  values?.[0] && values[1]
                    ? [
                        dateOnlyPickerToApi(values[0]),
                        dateOnlyPickerToApi(values[1]),
                      ]
                    : undefined,
                );
                setPage(1);
              }}
            />
          </FilterField>
          <FilterField label={SALES_LABELS.filters.product}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              value={productId}
              placeholder={SALES_LABELS.fields.productPlaceholder}
              options={productOptions}
              onChange={(value) => {
                setProductId(value);
                setPage(1);
              }}
              style={{ width: 220 }}
            />
          </FilterField>
          <FilterField label={SALES_LABELS.filters.minTotal}>
            <DecimalInput
              value={minTotal}
              onChange={(value) => {
                setMinTotal(value);
                setPage(1);
              }}
            />
          </FilterField>
          <FilterField label={SALES_LABELS.filters.maxTotal}>
            <DecimalInput
              value={maxTotal}
              onChange={(value) => {
                setMaxTotal(value);
                setPage(1);
              }}
            />
          </FilterField>
        </FilterBar>
      </Card>

      {list.isError ? (
        <Alert
          type="error"
          showIcon
          icon={phIcon(WarningCircle, { weight: "fill" })}
          message={mapApiError(list.error).userMessage}
          action={
            <Button
              size="small"
              icon={phIcon(ArrowCounterClockwise, { size: ICON_SIZE.sm })}
              onClick={() => void list.refetch()}
            >
              {SALES_LABELS.actions.retry}
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {isDesktop ? (
        <div className="commercial-table-shell">
          <Table
            className="commercial-documents-table"
            rowKey="id"
            size="middle"
            loading={list.isLoading}
            dataSource={list.data?.data ?? []}
            columns={columns}
            pagination={false}
            locale={{ emptyText: SALES_LABELS.messages.empty }}
            scroll={{ x: 1180 }}
            onChange={handleTableChange}
          />
        </div>
      ) : (
        <Space
          className="ui-mobile-list commercial-mobile-list"
          direction="vertical"
          size="middle"
        >
          {list.isLoading ? <Text>{SALES_LABELS.messages.loading}</Text> : null}
          {!list.isLoading && !list.data?.data.length ? (
            <Text type="secondary">{SALES_LABELS.messages.empty}</Text>
          ) : null}
          {(list.data?.data ?? []).map((record) => (
            <Card
              className="ui-mobile-card ui-document-card commercial-document-card"
              key={record.id}
              size="small"
              title={
                <Space>
                  <CodeText value={record.documentNumber} strong />
                  <StatusBadge status={record.status} />
                </Space>
              }
              extra={mobileHeaderActions(record)}
            >
              <div className="commercial-mobile-document-body">
                <div className="commercial-mobile-partner">
                  <EntityCell
                    code={partnerCode(record)}
                    name={partnerName(record)}
                  />
                  <Text className="commercial-mobile-total" strong>
                    {formatMoney(record.totalAmount)}
                  </Text>
                </div>
                <div className="commercial-mobile-meta">
                  <span>
                    {phIcon(CalendarBlank, { size: 13 })}
                    {formatDateTime(record.businessDate)}
                  </span>
                  <span>
                    {phIcon(Package, { size: 13 })}
                    {record.itemCount} sətir
                  </span>
                  <span>
                    {phIcon(User, { size: 13 })}
                    {createdByName(record)}
                  </span>
                </div>
                {mobileActions(record)}
              </div>
            </Card>
          ))}
        </Space>
      )}

      <Pagination
        className="commercial-pagination"
        current={page}
        pageSize={pageSize}
        total={list.data?.meta.total ?? 0}
        showSizeChanger
        showTotal={(total) => `Cəmi ${total}`}
        onChange={(nextPage, nextPageSize) => {
          setPage(nextPage);
          setPageSize(nextPageSize);
        }}
      />

      <Modal
        className="ui-confirm-modal ui-cancel-confirm-modal commercial-confirm-modal"
        wrapClassName="commercial-modal-wrap"
        centered
        open={Boolean(cancelTarget)}
        title={
          <Space>
            {phIcon(XCircle, { weight: "fill", size: ICON_SIZE.lg })}
            {SALES_LABELS.cancel.title}
          </Space>
        }
        okText={SALES_LABELS.actions.cancel}
        cancelText={SALES_LABELS.actions.back}
        okButtonProps={{ danger: true, disabled: !cancelReason.trim() }}
        confirmLoading={cancelMutation.isPending}
        onCancel={() => {
          setCancelTarget(undefined);
          setCancelReason("");
        }}
        onOk={async () => {
          if (!cancelTarget || !cancelReason.trim()) return;
          try {
            await cancelMutation.mutateAsync({
              id: cancelTarget.id,
              reason: cancelReason.trim(),
            });
            message.success(SALES_LABELS.cancel.success);
            setCancelTarget(undefined);
            setCancelReason("");
          } catch (error) {
            message.error(mapApiError(error).userMessage);
          }
        }}
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Text>{SALES_LABELS.cancel.text}</Text>
          <div>
            <Text strong>{SALES_LABELS.cancel.effectsTitle}</Text>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              {SALES_LABELS.cancel.effects.map((effect) => (
                <li key={effect}>
                  <Text type="secondary">{effect}</Text>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Text strong>{SALES_LABELS.cancel.reason}</Text>
            <Input.TextArea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder={SALES_LABELS.cancel.reasonPlaceholder}
              rows={3}
              maxLength={1000}
              showCount
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>

      <SalePostConfirmModal
        open={Boolean(postTarget)}
        confirmLoading={
          postMutation.isPending ||
          (Boolean(postTarget) && postTargetDetail.isLoading)
        }
        shortages={postShortages}
        documentTotal={
          postTargetDetail.data?.totalAmount ?? postTarget?.totalAmount
        }
        partnerDebtBalance={
          postTargetDetail.data?.partner.currentDebtBalance ??
          postTarget?.partner?.currentDebtBalance
        }
        onCancel={() => setPostTarget(undefined)}
        onConfirm={async (payload) => {
          if (!postTarget) return;
          try {
            await postMutation.mutateAsync({
              id: postTarget.id,
              input: payload,
            });
            message.success(SALES_LABELS.post.success);
            setPostTarget(undefined);
          } catch (error) {
            message.error(mapApiError(error).userMessage);
            throw error;
          }
        }}
      />

      <SaleFormModal
        key={
          formMode.kind === "edit" ? `edit-${formMode.saleId}` : formMode.kind
        }
        open={formMode.kind !== "closed"}
        saleId={formMode.kind === "edit" ? formMode.saleId : undefined}
        onCancel={() => setFormMode({ kind: "closed" })}
        onSaved={() => setFormMode({ kind: "closed" })}
      />
    </div>
  );
}
