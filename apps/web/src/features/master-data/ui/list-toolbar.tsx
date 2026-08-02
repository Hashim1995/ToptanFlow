import type { ReactNode } from "react";
import { Button, Collapse, Select, Space, Typography } from "antd";
import { FunnelSimple, X } from "@phosphor-icons/react";
import { ICON_SIZE, phIcon } from "../../../shared/ui/ph-icon";
import type { ActiveFilterValue } from "./active-filter";
import { MASTER_DATA_LABELS } from "./labels";
import "./list-toolbar.css";

const { Text } = Typography;

type FilterFieldProps = {
  label: string;
  children: ReactNode;
};

/** Visible label above a filter control (CHANGE-001 UX bar). */
export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="ui-filter-field">
      <Text className="ui-filter-label" type="secondary">
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
        className="ui-filter-control"
        aria-label={labels.status}
        options={[
          { value: "all", label: labels.all },
          { value: "active", label: labels.active },
          { value: "inactive", label: labels.inactive },
        ]}
      />
    </FilterField>
  );
}

type FilterBarProps = {
  children: ReactNode;
  onSearch?: () => void;
  onReset?: () => void;
  searchLabel?: string;
  resetLabel?: string;
  title?: string;
};

/**
 * Standard responsive filter accordion. It stays collapsed by default on all
 * viewports and exposes one consistent action row when opened.
 */
export function FilterBar({
  children,
  onSearch,
  onReset,
  searchLabel = "Axtar",
  resetLabel = "Təmizlə",
  title = "Axtarış və filtrlər",
}: FilterBarProps) {
  return (
    <Collapse
      className="ui-filter-collapse"
      bordered={false}
      defaultActiveKey={[]}
      expandIconPlacement="end"
      items={[
        {
          key: "filters",
          label: (
            <span className="ui-filter-collapse-title">
              {phIcon(FunnelSimple, { size: ICON_SIZE.sm })}
              <span>{title}</span>
            </span>
          ),
          children: (
            <div className="ui-filter-layout">
              <Space
                className="ui-filter-bar"
                wrap
                size={[12, 12]}
                style={{ width: "100%" }}
                align="end"
              >
                {children}
              </Space>
              {onSearch || onReset ? (
                <div className="ui-filter-actions">
                  {onReset ? (
                    <Button
                      className="ui-filter-reset"
                      icon={phIcon(X, { size: ICON_SIZE.sm })}
                      onClick={onReset}
                    >
                      {resetLabel}
                    </Button>
                  ) : null}
                  {onSearch ? (
                    <Button
                      type="primary"
                      icon={phIcon(FunnelSimple, { size: ICON_SIZE.sm })}
                      onClick={onSearch}
                    >
                      {searchLabel}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ),
        },
      ]}
    />
  );
}

/** @deprecated Use FilterBar — kept as alias during screen uplift. */
export const ListToolbar = FilterBar;
