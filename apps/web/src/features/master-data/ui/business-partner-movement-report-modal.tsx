import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  Button,
  Form,
  Modal,
  Radio,
  Select,
  Space,
  Spin,
  Steps,
  Typography,
  message,
} from "antd";
import { confirmWithoutAutofocus } from "../../../shared/ui/confirm-without-autofocus";
import { useQuery } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { mapApiError } from "../../../api/map-api-error";
import { ResponsiveDatePicker } from "../../../shared/ui/responsive-date-pickers";
import type {
  BusinessPartner,
  BusinessPartnerMovementReportQuery,
  PartnerMovementOperationType,
  PartnerMovementOutputFormat,
  PartnerMovementStatus,
} from "../api/business-partners.api";
import {
  downloadBusinessPartnerMovementReport,
  getBusinessPartnerMovementReport,
  listBusinessPartnerMovementReportUsers,
} from "../api/business-partners.api";
import {
  openPartnerMovementPrintWindow,
  renderPartnerMovementPrintWindow,
} from "./print-partner-movement-report";
import "./business-partner-movement-report-modal.css";

const OPERATION_TYPES: PartnerMovementOperationType[] = [
  "PURCHASE",
  "SALE",
  "CASH_IN",
  "CASH_OUT",
];
const STATUSES: PartnerMovementStatus[] = ["DRAFT", "POSTED", "CANCELLED"];

const schema = z.object({
  dateFrom: z
    .custom<Dayjs>((value) => dayjs.isDayjs(value) && value.isValid())
    .nullable(),
  dateTo: z
    .custom<Dayjs>((value) => dayjs.isDayjs(value) && value.isValid())
    .nullable(),
  operationTypes: z
    .array(z.enum(["PURCHASE", "SALE", "CASH_IN", "CASH_OUT"]))
    .min(1, "Ən azı bir əməliyyat növü seçin."),
  statuses: z
    .array(z.enum(["DRAFT", "POSTED", "CANCELLED"]))
    .min(1, "Ən azı bir status seçin."),
  createdByUserIds: z.array(z.string().uuid()),
  format: z.enum(["EXCEL", "PRINT"], {
    error: "Çıxış formatını seçin.",
  }),
});

type FormValues = z.infer<typeof schema>;
type ProcessPhase =
  "idle" | "preparing" | "generating" | "ready" | "started" | "completed";

const PHASE_INDEX: Record<Exclude<ProcessPhase, "idle">, number> = {
  preparing: 0,
  generating: 1,
  ready: 2,
  started: 3,
  completed: 4,
};

function waitForPaint(): Promise<void> {
  return new Promise((resolve) =>
    window.requestAnimationFrame(() => resolve()),
  );
}

export function BusinessPartnerMovementReportModal({
  partner,
  open,
  onClose,
}: {
  partner: BusinessPartner;
  open: boolean;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<ProcessPhase>("idle");
  const [activeFormat, setActiveFormat] =
    useState<PartnerMovementOutputFormat>();
  const [processError, setProcessError] = useState<string>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const printWindowRef = useRef<Window | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const users = useQuery({
    queryKey: ["business-partners", partner.id, "movement-report-users"],
    queryFn: ({ signal }) =>
      listBusinessPartnerMovementReportUsers(partner.id, signal),
    enabled: open,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    shouldFocusError: false,
    resolver: zodResolver(schema),
    defaultValues: {
      dateFrom: null,
      dateTo: null,
      operationTypes: OPERATION_TYPES,
      statuses: STATUSES,
      createdByUserIds: [],
    },
  });

  const busy = !["idle", "completed"].includes(phase);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
      printWindowRef.current?.close();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  function clearTransientState() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    printWindowRef.current?.close();
    printWindowRef.current = null;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setProcessError(undefined);
    setPhase("idle");
    setActiveFormat(undefined);
  }

  function requestClose() {
    if (!busy) {
      clearTransientState();
      onClose();
      return;
    }
    confirmWithoutAutofocus({
      title: "Report hazırlanmasını dayandırırsınız?",
      content:
        "Report hazırlanır və ya yükləmə tamamlanmayıb. Modalı bağlasanız əməliyyat yarımçıq qala bilər.",
      okText: "Prosesi dayandır",
      cancelText: "Davam et",
      okButtonProps: { danger: true },
      onOk: () => {
        clearTransientState();
        onClose();
      },
    });
  }

  async function submit(values: FormValues) {
    clearTransientState();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setActiveFormat(values.format);
    const query: BusinessPartnerMovementReportQuery = {
      dateFrom: values.dateFrom,
      dateTo: values.dateTo,
      operationTypes: values.operationTypes,
      statuses: values.statuses,
      createdByUserIds: values.createdByUserIds,
    };

    try {
      setPhase("preparing");
      await waitForPaint();

      if (values.format === "PRINT") {
        const printWindow = openPartnerMovementPrintWindow();
        if (!printWindow) {
          setPhase("idle");
          setProcessError("Çap pəncərəsini açmaq mümkün olmadı.");
          return;
        }
        printWindowRef.current = printWindow;
        const report = await getBusinessPartnerMovementReport(
          partner.id,
          query,
          controller.signal,
        );
        setPhase("generating");
        await waitForPaint();
        setPhase("ready");
        await waitForPaint();
        renderPartnerMovementPrintWindow(printWindow, report);
        setPhase("started");
        await waitForPaint();
        setPhase("completed");
        message.success("Print pəncərəsi açıldı. Report hazırdır.");
        return;
      }

      setPhase("generating");
      const blob = await downloadBusinessPartnerMovementReport(
        partner.id,
        query,
        values.format,
        controller.signal,
      );
      controller.signal.throwIfAborted();
      setPhase("ready");
      await waitForPaint();

      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `terefdas-hereketleri-${partner.code}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setPhase("started");
      await waitForPaint();
      URL.revokeObjectURL(objectUrl);
      objectUrlRef.current = null;
      setPhase("completed");
      message.success("Report uğurla yükləndi.");
    } catch (error) {
      if (controller.signal.aborted) return;
      setPhase("idle");
      setProcessError(mapApiError(error).userMessage);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }

  const processSteps =
    activeFormat === "PRINT"
      ? [
          { title: "Məlumatlar hazırlanır" },
          { title: "Report yaradılır" },
          { title: "Print görünüşü hazırlanır" },
          { title: "Print pəncərəsi açıldı" },
          { title: "Tamamlandı" },
        ]
      : [
          { title: "Məlumatlar hazırlanır" },
          { title: "Report yaradılır" },
          { title: "Yükləmə hazırlanır" },
          { title: "Yükləmə başladı" },
          { title: "Tamamlandı" },
        ];

  return (
    <Modal
      open={open}
      title="Tərəfdaş hərəkət reportu"
      className="business-partner-report-modal"
      wrapClassName="business-partner-report-modal-wrap"
      width={760}
      centered
      mask={{ closable: true }}
      keyboard
      onCancel={requestClose}
      footer={[
        <Button key="close" onClick={requestClose}>
          Bağla
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={busy}
          disabled={busy}
          onClick={() => void handleSubmit(submit)()}
        >
          Reportu hazırla
        </Button>,
      ]}
    >
      <div className="partner-report-identity">
        <Typography.Text type="secondary">Tərəfdaş</Typography.Text>
        <Typography.Text strong>
          {partner.name} ({partner.code})
        </Typography.Text>
      </div>

      {processError ? (
        <Alert
          type="error"
          showIcon
          message={processError}
          closable
          onClose={() => setProcessError(undefined)}
        />
      ) : null}

      <Form layout="vertical" className="partner-report-form">
        <div className="partner-report-date-fields">
          <Controller
            name="dateFrom"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Başlanğıc tarixi"
                help={errors.dateFrom?.message}
                validateStatus={errors.dateFrom ? "error" : undefined}
              >
                <ResponsiveDatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Başlanğıc tarixi"
                  format="DD.MM.YYYY"
                  allowClear
                  disabled={busy}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            )}
          />
          <Controller
            name="dateTo"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Bitmə tarixi"
                help={errors.dateTo?.message}
                validateStatus={errors.dateTo ? "error" : undefined}
              >
                <ResponsiveDatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Bitmə tarixi"
                  format="DD.MM.YYYY"
                  allowClear
                  disabled={busy}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            )}
          />
        </div>

        <div className="partner-report-grid">
          <Controller
            name="operationTypes"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Əməliyyat növü"
                required
                help={errors.operationTypes?.message}
                validateStatus={errors.operationTypes ? "error" : undefined}
              >
                <Select
                  mode="multiple"
                  value={field.value}
                  onChange={field.onChange}
                  maxTagCount="responsive"
                  placeholder="Əməliyyat növlərini seçin"
                  disabled={busy}
                  options={[
                    { value: "PURCHASE", label: "Alış" },
                    { value: "SALE", label: "Satış" },
                    { value: "CASH_IN", label: "Mədaxil" },
                    { value: "CASH_OUT", label: "Məxaric" },
                  ]}
                />
              </Form.Item>
            )}
          />

          <Controller
            name="statuses"
            control={control}
            render={({ field }) => (
              <Form.Item
                label="Status"
                required
                help={errors.statuses?.message}
                validateStatus={errors.statuses ? "error" : undefined}
              >
                <Select
                  mode="multiple"
                  value={field.value}
                  onChange={field.onChange}
                  maxTagCount="responsive"
                  placeholder="Statusları seçin"
                  disabled={busy}
                  options={[
                    { value: "DRAFT", label: "Qaralama" },
                    { value: "POSTED", label: "Tamamlanıb" },
                    { value: "CANCELLED", label: "Ləğv edilib" },
                  ]}
                />
              </Form.Item>
            )}
          />
        </div>

        <Controller
          name="createdByUserIds"
          control={control}
          render={({ field }) => (
            <Form.Item
              label="Əməliyyatı edən istifadəçi"
              help={
                errors.createdByUserIds?.message ??
                (field.value.length === 0
                  ? "Seçim edilmədikdə bütün istifadəçilər nəzərə alınır."
                  : undefined)
              }
              validateStatus={errors.createdByUserIds ? "error" : undefined}
            >
              <Select
                mode="multiple"
                showSearch
                optionFilterProp="label"
                value={field.value}
                onChange={field.onChange}
                maxTagCount="responsive"
                allowClear
                loading={users.isLoading}
                disabled={busy || users.isError}
                placeholder="Bütün istifadəçilər"
                options={(users.data ?? []).map((user) => ({
                  value: user.id,
                  label: user.isActive
                    ? user.fullName
                    : `${user.fullName} (deaktiv)`,
                }))}
              />
            </Form.Item>
          )}
        />
        {users.isError ? (
          <Alert
            type="warning"
            showIcon
            message="İstifadəçi siyahısı yüklənmədi. Report bütün istifadəçilər üzrə hazırlana bilər."
            action={
              <Button size="small" onClick={() => void users.refetch()}>
                Yenidən cəhd et
              </Button>
            }
          />
        ) : null}

        <Controller
          name="format"
          control={control}
          render={({ field }) => (
            <Form.Item
              label="Çıxış formatı"
              required
              help={errors.format?.message}
              validateStatus={errors.format ? "error" : undefined}
            >
              <Radio.Group
                value={field.value}
                onChange={(event) =>
                  field.onChange(
                    event.target.value as PartnerMovementOutputFormat,
                  )
                }
                disabled={busy}
                buttonStyle="solid"
              >
                <Radio.Button value="EXCEL">Excel</Radio.Button>
                <Radio.Button value="PRINT">Print</Radio.Button>
              </Radio.Group>
            </Form.Item>
          )}
        />
      </Form>

      {phase !== "idle" ? (
        <div className={`partner-report-progress is-${phase}`}>
          <Space align="center">
            {phase !== "completed" ? <Spin size="small" /> : null}
            <Typography.Text strong>
              {
                processSteps[
                  PHASE_INDEX[phase as Exclude<ProcessPhase, "idle">]
                ].title
              }
            </Typography.Text>
          </Space>
          <Steps
            size="small"
            responsive={false}
            current={PHASE_INDEX[phase as Exclude<ProcessPhase, "idle">]}
            status={phase === "completed" ? "finish" : "process"}
            items={processSteps}
          />
        </div>
      ) : null}
    </Modal>
  );
}
