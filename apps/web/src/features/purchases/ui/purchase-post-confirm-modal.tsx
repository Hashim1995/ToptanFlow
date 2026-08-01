import { useMemo, useState } from 'react';
import { Modal, Space, Typography } from 'antd';
import { CheckCircle } from '@phosphor-icons/react';
import { useCashAccountsList } from '../../cash/api/cash.hooks';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import type { PostPurchaseInput } from '../api/purchases.api';
import { PURCHASE_LABELS } from './labels';
import {
  emptyPurchaseImmediatePayment,
  isPurchaseImmediatePaymentValid,
  PurchaseImmediatePaymentSection,
  purchaseNeedsNegativeReason,
  type PurchaseImmediatePaymentState,
} from './purchase-immediate-payment-section';

const { Text } = Typography;

type PurchasePostConfirmModalProps = {
  open: boolean;
  confirmLoading?: boolean;
  documentTotal?: string;
  partnerDebtBalance?: string;
  initialPayment?: PurchaseImmediatePaymentState;
  onCancel: () => void;
  onConfirm: (payload: PostPurchaseInput) => Promise<void>;
};

export function PurchasePostConfirmModal({
  open,
  confirmLoading,
  documentTotal = '',
  partnerDebtBalance = '',
  initialPayment,
  onCancel,
  onConfirm,
}: PurchasePostConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <PurchasePostConfirmModalBody
      key={`${documentTotal}:${partnerDebtBalance}:${initialPayment?.enabled}:${initialPayment?.cashAccountId}:${initialPayment?.amount}`}
      confirmLoading={confirmLoading}
      documentTotal={documentTotal}
      partnerDebtBalance={partnerDebtBalance}
      initialPayment={initialPayment}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}

function PurchasePostConfirmModalBody({
  confirmLoading,
  documentTotal,
  partnerDebtBalance,
  initialPayment,
  onCancel,
  onConfirm,
}: Omit<PurchasePostConfirmModalProps, 'open'> & {
  documentTotal: string;
  partnerDebtBalance: string;
}) {
  const [payment, setPayment] = useState<PurchaseImmediatePaymentState>(
    () =>
      initialPayment ?? emptyPurchaseImmediatePayment(documentTotal),
  );

  const accounts = useCashAccountsList({
    page: 1,
    pageSize: 100,
    isActive: true,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const selectedBalance = useMemo(
    () =>
      accounts.data?.data.find((row) => row.id === payment.cashAccountId)
        ?.currentBalance,
    [accounts.data?.data, payment.cashAccountId],
  );

  const needsNegativeReason = purchaseNeedsNegativeReason(
    payment,
    selectedBalance,
  );
  const paymentValid = isPurchaseImmediatePaymentValid(
    payment,
    needsNegativeReason,
  );

  return (
    <Modal
      open
      zIndex={1100}
      title={
        <Space>
          {phIcon(CheckCircle, { weight: 'fill', size: ICON_SIZE.lg })}
          {PURCHASE_LABELS.post.title}
        </Space>
      }
      okText={PURCHASE_LABELS.actions.post}
      cancelText={PURCHASE_LABELS.actions.back}
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: !paymentValid }}
      onCancel={onCancel}
      onOk={async () => {
        if (payment.enabled && !paymentValid) {
          throw new Error(PURCHASE_LABELS.post.immediatePaymentRequired);
        }
        await onConfirm({
          immediatePayment: payment.enabled
            ? {
                cashAccountId: payment.cashAccountId!,
                amount: Number.parseFloat(payment.amount).toFixed(2),
                notes: payment.notes.trim() || undefined,
                negativeBalanceOverrideReason: needsNegativeReason
                  ? payment.negativeBalanceOverrideReason.trim()
                  : undefined,
              }
            : undefined,
        });
      }}
      destroyOnHidden
      width={560}
    >
      <Text>{PURCHASE_LABELS.post.text}</Text>

      <div style={{ marginTop: 16 }}>
        <PurchaseImmediatePaymentSection
          value={payment}
          onChange={setPayment}
          documentTotal={documentTotal}
          partnerDebtBalance={partnerDebtBalance}
        />
      </div>
    </Modal>
  );
}
