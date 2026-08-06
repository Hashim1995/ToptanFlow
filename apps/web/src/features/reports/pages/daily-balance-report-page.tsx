import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Space,
  Spin,
  Steps,
  Statistic,
  Typography,
  message,
} from 'antd';
import { FileXls, Printer } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { mapApiError } from '../../../api/map-api-error';
import { formatDateTime } from '../../../shared/datetime';
import { formatMoney } from '../../../shared/money/format-money';
import { confirmWithoutAutofocus } from '../../../shared/ui/confirm-without-autofocus';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import { PageHeader } from '../../master-data/ui/page-header';
import {
  downloadDailyBalanceReport,
  getDailyBalanceReport,
} from '../api/daily-balance-report.api';
import { DAILY_BALANCE_REPORT_LABELS as labels } from '../ui/labels';
import {
  openDailyBalancePrintWindow,
  renderDailyBalancePrintWindow,
} from '../ui/print-daily-balance-report';
import './daily-balance-report-page.css';

type ProcessPhase =
  | 'idle'
  | 'preparing'
  | 'generating'
  | 'ready'
  | 'started'
  | 'completed';

type OutputFormat = 'EXCEL' | 'PRINT';

const PHASE_INDEX: Record<Exclude<ProcessPhase, 'idle'>, number> = {
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

export function DailyBalanceReportPage() {
  const [phase, setPhase] = useState<ProcessPhase>('idle');
  const [activeFormat, setActiveFormat] = useState<OutputFormat>();
  const [processError, setProcessError] = useState<string>();
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string>();
  const [summary, setSummary] = useState<{
    partnerCount: number;
    totalPartnerReceivable: string;
    totalPartnerPayable: string;
    totalPartnerDebtBalance: string;
    activeCashAccountCount: number;
    totalCompanyCash: string;
  }>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const printWindowRef = useRef<Window | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const busy = !['idle', 'completed'].includes(phase);

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
    setPhase('idle');
    setActiveFormat(undefined);
  }

  function requestAbort() {
    if (!busy) return;
    confirmWithoutAutofocus({
      title: labels.abortTitle,
      content: labels.abortContent,
      okText: labels.abortOk,
      cancelText: labels.abortCancel,
      okButtonProps: { danger: true },
      onOk: () => {
        clearTransientState();
      },
    });
  }

  async function run(format: OutputFormat) {
    clearTransientState();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setActiveFormat(format);

    try {
      setPhase('preparing');
      await waitForPaint();

      if (format === 'PRINT') {
        const printWindow = openDailyBalancePrintWindow();
        if (!printWindow) {
          setPhase('idle');
          setProcessError(labels.printOpenError);
          return;
        }
        printWindowRef.current = printWindow;
        const report = await getDailyBalanceReport(controller.signal);
        setSummary({
          partnerCount: report.partnerCount,
          totalPartnerReceivable: report.totalPartnerReceivable,
          totalPartnerPayable: report.totalPartnerPayable,
          totalPartnerDebtBalance: report.totalPartnerDebtBalance,
          activeCashAccountCount: report.activeCashAccountCount,
          totalCompanyCash: report.totalCompanyCash,
        });
        setLastGeneratedAt(report.generatedAt);
        setPhase('generating');
        await waitForPaint();
        setPhase('ready');
        await waitForPaint();
        renderDailyBalancePrintWindow(printWindow, report);
        setPhase('started');
        await waitForPaint();
        setPhase('completed');
        message.success(labels.printSuccess);
        return;
      }

      setPhase('generating');
      const blob = await downloadDailyBalanceReport(controller.signal);
      controller.signal.throwIfAborted();
      setPhase('ready');
      await waitForPaint();

      const stamp = new Date().toISOString().slice(0, 10);
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `gunluk-report-${stamp}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setPhase('started');
      await waitForPaint();
      URL.revokeObjectURL(objectUrl);
      objectUrlRef.current = null;
      setPhase('completed');
      message.success(labels.excelSuccess);
    } catch (error) {
      if (controller.signal.aborted) return;
      setPhase('idle');
      setProcessError(mapApiError(error).userMessage);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }

  const processSteps =
    activeFormat === 'PRINT'
      ? [
          { title: labels.stagePreparing },
          { title: labels.stageGenerating },
          { title: labels.stageReady },
          { title: labels.stageStarted },
          { title: labels.stageCompleted },
        ]
      : [
          { title: labels.stagePreparing },
          { title: labels.stageGenerating },
          { title: labels.stageReady },
          { title: labels.stageStarted },
          { title: labels.stageCompleted },
        ];

  return (
    <div className="ui-page ui-report-page daily-balance-report-page">
      <PageHeader
        title={labels.title}
        description={labels.description}
        icon={phIcon(FileXls, { size: ICON_SIZE.xl, weight: 'duotone' })}
      />

      <Card className="daily-balance-actions-card" size="small">
        <Space wrap size={12}>
          <Button
            type="primary"
            icon={phIcon(FileXls, { size: ICON_SIZE.sm })}
            loading={busy && activeFormat === 'EXCEL'}
            disabled={busy && activeFormat !== 'EXCEL'}
            onClick={() => void run('EXCEL')}
          >
            {labels.excelAction}
          </Button>
          <Button
            icon={phIcon(Printer, { size: ICON_SIZE.sm })}
            loading={busy && activeFormat === 'PRINT'}
            disabled={busy && activeFormat !== 'PRINT'}
            onClick={() => void run('PRINT')}
          >
            {labels.printAction}
          </Button>
          {busy ? (
            <Button danger onClick={requestAbort}>
              {labels.abortOk}
            </Button>
          ) : null}
        </Space>

        {busy || phase === 'completed' ? (
          <div className="daily-balance-process">
            <Spin spinning={busy} size="small">
              <Steps
                size="small"
                current={phase === 'idle' ? 0 : PHASE_INDEX[phase]}
                items={processSteps}
              />
            </Spin>
          </div>
        ) : null}

        {processError ? (
          <Alert
            className="daily-balance-error"
            type="error"
            showIcon
            message={processError}
          />
        ) : null}
      </Card>

      {summary ? (
        <Card className="daily-balance-summary-card" size="small">
          {lastGeneratedAt ? (
            <Typography.Text type="secondary" className="daily-balance-stamp">
              {labels.generatedAt}: {formatDateTime(lastGeneratedAt)}
            </Typography.Text>
          ) : null}
          <Row gutter={[16, 16]}>
            <Col xs={12} md={8}>
              <Statistic title={labels.partnerCount} value={summary.partnerCount} />
            </Col>
            <Col xs={12} md={8}>
              <Statistic
                title={labels.totalPartnerReceivable}
                value={formatMoney(summary.totalPartnerReceivable)}
                suffix="AZN"
              />
            </Col>
            <Col xs={12} md={8}>
              <Statistic
                title={labels.totalPartnerPayable}
                value={formatMoney(summary.totalPartnerPayable)}
                suffix="AZN"
              />
            </Col>
            <Col xs={12} md={8}>
              <Statistic
                title={labels.totalPartnerDebt}
                value={formatMoney(summary.totalPartnerDebtBalance)}
                suffix="AZN"
              />
            </Col>
            <Col xs={12} md={8}>
              <Statistic
                title={labels.cashAccountCount}
                value={summary.activeCashAccountCount}
              />
            </Col>
            <Col xs={12} md={8}>
              <Statistic
                title={labels.totalCompanyCash}
                value={formatMoney(summary.totalCompanyCash)}
                suffix="AZN"
              />
            </Col>
          </Row>
        </Card>
      ) : null}
    </div>
  );
}
