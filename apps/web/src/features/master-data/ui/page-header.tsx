import type { ReactNode } from 'react';
import { Space, Typography } from 'antd';

const { Title, Text } = Typography;

type PageHeaderProps = {
  title: string;
  description?: string;
  extra?: ReactNode;
};

/**
 * Shared master-data page header (CHANGE-001 / US-042 UX kit).
 */
export function PageHeader({ title, description, extra }: PageHeaderProps) {
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
        <Title level={3} style={{ margin: 0 }}>
          {title}
        </Title>
        {description ? (
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
            {description}
          </Text>
        ) : null}
      </div>
      {extra ? <div>{extra}</div> : null}
    </Space>
  );
}
