import { useState } from 'react';
import { Alert, Input, List, Modal, Space, Typography } from 'antd';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import type { ImmediatePaymentInput } from '../api/sales.api';
import { formatShortageLine, type QuantityShortage } from './quantity-shortage';
import { SALES_LABELS } from './labels';
import {
  emptySaleImmediatePayment,
  isSaleImmediatePaymentValid,
  type SaleImmediatePaymentState,
} from './sale-immediate-payment';
import { SaleImmediatePaymentSection } from './sale-immediate-payment-section';

const { Text } = Typography;

export type SalePostConfirmPayload = {
  negativeQuantityReason?: string;
  immediatePayment?: ImmediatePaymentInput;
};

type SalePostConfirmModalProps = {
  open: boolean;
  confirmLoading?: boolean;
  shortages?: QuantityShortage[];
  documentTotal?: string;
  partnerDebtBalance?: string;
  initialPayment?: SaleImmediatePaymentState;
  onCancel: () => void;
  onConfirm: (payload: SalePostConfirmPayload) => Promise<void>;
};

export function SalePostConfirmModal({
  open,
  confirmLoading,
  shortages = [],
  documentTotal = '',
  partnerDebtBalance = '',
  initialPayment,
  onCancel,
  onConfirm,
}: SalePostConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <SalePostConfirmModalBody
      key={`${documentTotal}:${partnerDebtBalance}:${initialPayment?.enabled}:${initialPayment?.cashAccountId}:${initialPayment?.amount}`}
      confirmLoading={confirmLoading}
      shortages={shortages}
      documentTotal={documentTotal}
      partnerDebtBalance={partnerDebtBalance}
      initialPayment={initialPayment}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

function SalePostConfirmModalBody({
  confirmLoading,
  shortages,
  documentTotal,
  partnerDebtBalance,
  initialPayment,
  onCancel,
  onConfirm,
}: Omit<SalePostConfirmModalProps, 'open'> & {
  shortages: QuantityShortage[];
  documentTotal: string;
  partnerDebtBalance: string;
}) {
  const [negativeQuantityReason, setNegativeQuantityReason] = useState('');
  const [payment, setPayment] = useState<SaleImmediatePaymentState>(
    () => initialPayment ?? emptySaleImmediatePayment(documentTotal),
  );
  const hasShortage = shortages.length > 0;
  const paymentValid = isSaleImmediatePaymentValid(payment);

  return (
    <Modal
      className="ui-confirm-modal ui-post-confirm-modal commercial-confirm-modal commercial-post-modal"
      wrapClassName="commercial-modal-wrap"
      centered
      open
      zIndex={1100}
      title={
        <Space>
          {phIcon(CheckCircle, { weight: 'fill', size: ICON_SIZE.lg })}
          {SALES_LABELS.post.title}
        </Space>
      }
      okText={SALES_LABELS.actions.post}
      cancelText={SALES_LABELS.actions.back}
      confirmLoading={confirmLoading}
      okButtonProps={{
        disabled:
          (hasShortage && !negativeQuantityReason.trim()) || !paymentValid,
      }}
      onCancel={onCancel}
      onOk={async () => {
        const reason = negativeQuantityReason.trim();
        if (hasShortage && !reason) {
          throw new Error(SALES_LABELS.post.negativeQuantityReasonRequired);
        }
        if (payment.enabled && !paymentValid) {
          throw new Error(SALES_LABELS.post.immediatePaymentRequired);
        }
        await onConfirm({
          negativeQuantityReason: hasShortage ? reason : undefined,
          immediatePayment: payment.enabled
            ? {
                cashAccountId: payment.cashAccountId!,
                amount: Number.parseFloat(payment.amount).toFixed(2),
                notes: payment.notes.trim() || undefined,
              }
            : undefined,
        });
      }}
      destroyOnHidden
      width={560}
    >
      <Text>{SALES_LABELS.post.text}</Text>

      {hasShortage ? (
        <Alert
          type="warning"
          showIcon
          icon={phIcon(WarningCircle, { weight: 'fill' })}
          style={{ marginTop: 16 }}
          message={SALES_LABELS.post.negativeQuantityAlert}
          description={
            <List
              size="small"
              dataSource={shortages}
              renderItem={(item) => (
                <List.Item style={{ padding: '4px 0', border: 'none' }}>
                  <Text style={{ fontSize: 13 }}>
                    {formatShortageLine(item)}
                  </Text>
                </List.Item>
              )}
            />
          }
        />
      ) : null}

      {hasShortage ? (
        <div style={{ marginTop: 16 }}>
          <Text strong>{SALES_LABELS.post.negativeQuantityReason}</Text>
          <Input.TextArea
            value={negativeQuantityReason}
            onChange={(event) => setNegativeQuantityReason(event.target.value)}
            placeholder={SALES_LABELS.post.negativeQuantityReasonPlaceholder}
            rows={3}
            maxLength={2000}
            showCount
            status={!negativeQuantityReason.trim() ? 'error' : undefined}
          />
          {!negativeQuantityReason.trim() ? (
            <Text type="danger" style={{ fontSize: 12 }}>
              {SALES_LABELS.post.negativeQuantityReasonRequired}
            </Text>
          ) : null}
        </div>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <SaleImmediatePaymentSection
          value={payment}
          onChange={setPayment}
          documentTotal={documentTotal}
          partnerDebtBalance={partnerDebtBalance}
        />
      </div>
    </Modal>
  );
}
