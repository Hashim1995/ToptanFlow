import type { ReactNode } from 'react';
import { Select, Space, Typography } from 'antd';
import type { ActiveFilterValue } from './active-filter';
import { MASTER_DATA_LABELS } from './labels';

const { Text } = Typography;

type FilterFieldProps = {
  label: string;
  children: ReactNode;
};

/**
 * Visible label above a filter control (CHANGE-001 UX bar).
 * Prefer this over placeholder-only Selects that always have a selected value.
 */
export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
      }}
    >
      <Text
        type="secondary"
        style={{ fontSize: 12, lineHeight: 1.2, whiteSpace: 'nowrap' }}
      >
        {label}
      </Text>
      {children}
    </div>
  );
}

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
    <FilterField label={labels.status}>
      <Select
        value={value}
        onChange={onChange}
        style={{ minWidth: 160 }}
        aria-label={labels.status}
        options={[
          { value: 'all', label: labels.all },
          { value: 'active', label: labels.active },
          { value: 'inactive', label: labels.inactive },
        ]}
      />
    </FilterField>
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
      align="end"
    >
      {children}
    </Space>
  );
}

/** @deprecated Use FilterBar — kept as alias during screen uplift. */
export const ListToolbar = FilterBar;
