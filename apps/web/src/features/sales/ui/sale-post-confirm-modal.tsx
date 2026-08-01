import { useEffect, useState } from 'react';
import { Alert, Input, List, Modal, Space, Typography } from 'antd';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { ICON_SIZE, phIcon } from '../../../shared/ui/ph-icon';
import {
  formatShortageLine,
  type QuantityShortage,
} from './quantity-shortage';
import { SALES_LABELS } from './labels';

const { Text } = Typography;

type SalePostConfirmModalProps = {
  open: boolean;
  confirmLoading?: boolean;
  shortages?: QuantityShortage[];
  onCancel: () => void;
  onConfirm: (negativeQuantityReason?: string) => Promise<void>;
};

export function SalePostConfirmModal({
  open,
  confirmLoading,
  shortages = [],
  onCancel,
  onConfirm,
}: SalePostConfirmModalProps) {
  const [negativeQuantityReason, setNegativeQuantityReason] = useState('');
  const hasShortage = shortages.length > 0;

  useEffect(() => {
    if (!open) {
      setNegativeQuantityReason('');
    }
  }, [open]);

  function handleCancel() {
    setNegativeQuantityReason('');
    onCancel();
  }

  return (
    <Modal
      open={open}
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
        disabled: hasShortage && !negativeQuantityReason.trim(),
      }}
      onCancel={handleCancel}
      onOk={async () => {
        const reason = negativeQuantityReason.trim();
        if (hasShortage && !reason) {
          throw new Error(SALES_LABELS.post.negativeQuantityReasonRequired);
        }
        await onConfirm(hasShortage ? reason : undefined);
        setNegativeQuantityReason('');
      }}
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
                  <Text style={{ fontSize: 13 }}>{formatShortageLine(item)}</Text>
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
    </Modal>
  );
}
