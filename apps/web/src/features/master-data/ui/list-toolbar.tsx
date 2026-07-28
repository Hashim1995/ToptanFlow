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
      style={{ minWidth: 160 }}
      aria-label={labels.filterStatus}
      placeholder={labels.filterStatus}
      options={[
        { value: 'all', label: labels.all },
        { value: 'active', label: labels.active },
        { value: 'inactive', label: labels.inactive },
      ]}
    />
  );
}

type FilterBarProps = {
  children: ReactNode;
};

/**
 * Responsive list FilterBar (CHANGE-001 / US-042 UX kit).
 * Prefer Input.Search + ActiveStatusFilter + domain Selects as children.
 */
export function FilterBar({ children }: FilterBarProps) {
  return (
    <Space
      wrap
      size={[12, 12]}
      style={{ width: '100%', marginBottom: 16 }}
      align="center"
    >
      {children}
    </Space>
  );
}

/** @deprecated Use FilterBar — kept as alias during screen uplift. */
export const ListToolbar = FilterBar;
