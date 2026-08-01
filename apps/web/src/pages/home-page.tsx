import { Card, Col, Row, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Package,
  Ruler,
  ShoppingCart,
  SquaresFour,
  UsersThree,
} from '@phosphor-icons/react';
import { MASTER_DATA_LABELS } from '../features/master-data/ui/labels';
import { PURCHASE_LABELS } from '../features/purchases/ui/labels';
import { ICON_SIZE, phIcon } from '../shared/ui/ph-icon';

const { Title, Paragraph, Text } = Typography;

const SHORTCUTS = [
  {
    to: '/purchases',
    title: PURCHASE_LABELS.nav,
    description: 'Alış qaralamaları, təsdiq və ləğv əməliyyatları',
    icon: ShoppingCart,
    color: '#1677ff',
  },
  {
    to: '/products',
    title: MASTER_DATA_LABELS.products.nav,
    description: 'Məhsul kataloqu, cari miqdar və qiymət məlumatları',
    icon: Package,
    color: '#13c2c2',
  },
  {
    to: '/business-partners',
    title: MASTER_DATA_LABELS.partners.nav,
    description: 'Müştəri və təchizatçı qeydləri',
    icon: UsersThree,
    color: '#722ed1',
  },
  {
    to: '/product-categories',
    title: MASTER_DATA_LABELS.categories.nav,
    description: 'Məhsul kateqoriyaları',
    icon: SquaresFour,
    color: '#fa8c16',
  },
  {
    to: '/units',
    title: MASTER_DATA_LABELS.units.nav,
    description: 'Ölçü vahidləri',
    icon: Ruler,
    color: '#52c41a',
  },
] as const;

/**
 * Landing surface with clear entry points (CHANGE-001; ADR-029 / ADR-031).
 */
export function HomePage() {
  return (
    <>
      <Title level={2} style={{ marginBottom: 8 }}>
        Ana səhifə
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 28, maxWidth: 560 }}>
        Əsas iş axınlarına buradan keçin. Satış və kassa modulları növbəti
        hekayələrdə əlavə olunacaq.
      </Paragraph>

      <Row gutter={[16, 16]}>
        {SHORTCUTS.map((item) => (
          <Col xs={24} sm={12} lg={8} key={item.to}>
            <Link to={item.to} style={{ display: 'block', height: '100%' }}>
              <Card
                hoverable
                styles={{
                  body: {
                    minHeight: 128,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  },
                }}
              >
                <Space
                  style={{ width: '100%', justifyContent: 'space-between' }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${item.color}14`,
                      color: item.color,
                    }}
                  >
                    {phIcon(item.icon, {
                      size: ICON_SIZE.xl,
                      weight: 'duotone',
                    })}
                  </span>
                  {phIcon(ArrowRight, { size: ICON_SIZE.sm })}
                </Space>
                <Text strong style={{ fontSize: 16 }}>
                  {item.title}
                </Text>
                <Paragraph
                  type="secondary"
                  style={{ marginBottom: 0, marginTop: 0 }}
                >
                  {item.description}
                </Paragraph>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </>
  );
}
