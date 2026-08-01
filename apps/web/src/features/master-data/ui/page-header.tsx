import type { ReactNode } from 'react';
import { Space, Typography } from 'antd';

const { Title, Text } = Typography;

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  extra?: ReactNode;
};

/**
 * Shared page header (CHANGE-001 / US-042 UX kit).
 */
export function PageHeader({
  title,
  description,
  icon,
  extra,
}: PageHeaderProps) {
  return (
    <Space
      style={{
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 20,
        alignItems: 'flex-start',
      }}
      wrap
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <Space align="center" size={10} style={{ marginBottom: 2 }}>
          {icon ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(22, 119, 255, 0.08)',
                color: '#1677ff',
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          ) : null}
          <Title level={3} style={{ margin: 0 }}>
            {title}
          </Title>
        </Space>
        {description ? (
          <div
            style={{
              marginTop: 4,
              marginLeft: icon ? 46 : 0,
            }}
          >
            {typeof description === 'string' ? (
              <Text type="secondary">{description}</Text>
            ) : (
              description
            )}
          </div>
        ) : null}
      </div>
      {extra ? <div>{extra}</div> : null}
    </Space>
  );
}
