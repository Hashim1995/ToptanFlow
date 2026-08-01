import type { CSSProperties, ReactNode } from 'react';
import { Space, Typography } from 'antd';

const { Text } = Typography;

const codeStyle: CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 12,
  letterSpacing: 0.2,
};

type CodeTextProps = {
  value: string;
  strong?: boolean;
};

/** Compact monospace business code. */
export function CodeText({ value, strong }: CodeTextProps) {
  return (
    <Text strong={strong} style={codeStyle} copyable={{ text: value }}>
      {value}
    </Text>
  );
}

type EntityCellProps = {
  code?: string | null;
  name: string;
  secondary?: ReactNode;
};

/** Primary name with optional code above and secondary meta below. */
export function EntityCell({ code, name, secondary }: EntityCellProps) {
  return (
    <Space direction="vertical" size={0} style={{ maxWidth: 280 }}>
      {code ? (
        <Text type="secondary" style={{ ...codeStyle, fontSize: 11 }}>
          {code}
        </Text>
      ) : null}
      <Text strong style={{ lineHeight: 1.3 }}>
        {name}
      </Text>
      {secondary ? (
        <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.3 }}>
          {secondary}
        </Text>
      ) : null}
    </Space>
  );
}

type MoneyCellProps = {
  value: string | number | null | undefined;
  format: (amount: string | number) => string;
  emphasize?: boolean;
};

/** Right-aligned money cell for tables. */
export function MoneyCell({ value, format, emphasize }: MoneyCellProps) {
  if (value === null || value === undefined || value === '') {
    return (
      <Text type="secondary" style={{ display: 'block', textAlign: 'right' }}>
        —
      </Text>
    );
  }
  return (
    <Text
      strong={emphasize}
      style={{ display: 'block', textAlign: 'right', whiteSpace: 'nowrap' }}
    >
      {format(value)}
    </Text>
  );
}

type MetaCellProps = {
  primary: ReactNode;
  secondary?: ReactNode;
};

export function MetaCell({ primary, secondary }: MetaCellProps) {
  return (
    <Space direction="vertical" size={0}>
      <Text style={{ lineHeight: 1.3 }}>{primary}</Text>
      {secondary ? (
        <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.3 }}>
          {secondary}
        </Text>
      ) : null}
    </Space>
  );
}
