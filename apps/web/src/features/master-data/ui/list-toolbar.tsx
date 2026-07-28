import type { ReactNode } from 'react';
import { Select, Space } from 'antd';
import type { ActiveFilterValue } from './active-filter';
import { MASTER_DATA_LABELS } from './labels';

type ActiveStatusFilterProps = {
  value: ActiveFilterValue;
  onChange: (value: ActiveFilterValue) => void;
};

export function ActiveStatusFilter({
  value,
  onChange,
}: ActiveStatusFilterProps) {
  const labels = MASTER_DATA_LABELS.common;

  return (
    <Select
      value={value}
      onChange={onChange}
      style={{ minWidth: 140 }}
      aria-label={labels.filterStatus}
      options={[
        { value: 'all', label: labels.all },
        { value: 'active', label: labels.active },
        { value: 'inactive', label: labels.inactive },
      ]}
    />
  );
}

type ListToolbarProps = {
  children: ReactNode;
};

export function ListToolbar({ children }: ListToolbarProps) {
  return (
    <Space wrap style={{ width: '100%', marginBottom: 16 }}>
      {children}
    </Space>
  );
}
