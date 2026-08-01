import { Tag } from 'antd';
import { MASTER_DATA_LABELS } from './labels';

type ActiveStatusTagProps = {
  isActive: boolean;
};

export function ActiveStatusTag({ isActive }: ActiveStatusTagProps) {
  const labels = MASTER_DATA_LABELS.common;
  return isActive ? (
    <Tag color="success">{labels.active}</Tag>
  ) : (
    <Tag>{labels.inactive}</Tag>
  );
}
