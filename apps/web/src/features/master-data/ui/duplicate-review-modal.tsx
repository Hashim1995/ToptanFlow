import { Button, List, Modal, Space, Tag, Typography } from 'antd';
import type {
  BusinessPartnerDuplicateCandidate,
  BusinessPartnerDuplicateMatchedField,
} from '../api/master-data.types';
import { ActiveStatusTag } from './active-status-tag';
import { MASTER_DATA_LABELS } from './labels';

const { Text, Paragraph } = Typography;

type DuplicateReviewModalProps = {
  open: boolean;
  candidates: BusinessPartnerDuplicateCandidate[];
  submitting: boolean;
  onCancel: () => void;
  onAcknowledge: () => void;
};

function roleText(candidate: BusinessPartnerDuplicateCandidate): string {
  const labels = MASTER_DATA_LABELS.partners;
  if (candidate.isCustomer && candidate.isSupplier) return labels.bothRoles;
  if (candidate.isCustomer) return labels.customer;
  if (candidate.isSupplier) return labels.supplier;
  return '—';
}

function matchedFieldLabel(field: BusinessPartnerDuplicateMatchedField): string {
  return MASTER_DATA_LABELS.partners.matched[field];
}

export function DuplicateReviewModal({
  open,
  candidates,
  submitting,
  onCancel,
  onAcknowledge,
}: DuplicateReviewModalProps) {
  const labels = MASTER_DATA_LABELS.partners;
  const common = MASTER_DATA_LABELS.common;

  return (
    <Modal
      title={labels.duplicateTitle}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={submitting}>
          {common.cancel}
        </Button>,
        <Button
          key="ack"
          type="primary"
          danger
          loading={submitting}
          onClick={onAcknowledge}
        >
          {labels.duplicateAcknowledge}
        </Button>,
      ]}
      width={640}
      destroyOnHidden
    >
      <Paragraph>{labels.duplicateIntro}</Paragraph>
      <List
        dataSource={candidates}
        locale={{ emptyText: labels.empty }}
        renderItem={(candidate) => (
          <List.Item>
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              <Text strong>
                {candidate.code} — {candidate.name}
              </Text>
              <Text type="secondary">
                {labels.role}: {roleText(candidate)}
              </Text>
              <Text type="secondary">
                {labels.phone}: {candidate.phone ?? '—'}
              </Text>
              <Text type="secondary">
                {labels.taxNumber}: {candidate.taxNumber ?? '—'}
              </Text>
              <ActiveStatusTag isActive={candidate.isActive} />
              <div>
                <Text type="secondary">{labels.matchedFields}: </Text>
                <Space size={[4, 4]} wrap>
                  {candidate.matchedFields.map((field) => (
                    <Tag key={field}>{matchedFieldLabel(field)}</Tag>
                  ))}
                </Space>
              </div>
            </Space>
          </List.Item>
        )}
      />
    </Modal>
  );
}
