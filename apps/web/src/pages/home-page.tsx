import { Card, Col, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { MASTER_DATA_LABELS } from '../features/master-data/ui/labels';

const { Title, Paragraph, Text } = Typography;

const SHORTCUTS = [
  {
    to: '/products',
    title: MASTER_DATA_LABELS.products.nav,
    description: 'Məhsul kataloqu və qiymət məlumatları',
  },
  {
    to: '/business-partners',
    title: MASTER_DATA_LABELS.partners.nav,
    description: 'Müştəri və təchizatçı qeydləri',
  },
  {
    to: '/product-categories',
    title: MASTER_DATA_LABELS.categories.nav,
    description: 'Məhsul kateqoriyaları',
  },
  {
    to: '/units',
    title: MASTER_DATA_LABELS.units.nav,
    description: 'Ölçü vahidləri',
  },
  {
    to: '/currencies',
    title: MASTER_DATA_LABELS.currencies.nav,
    description: 'Valyuta istinadları',
  },
] as const;

/**
 * Landing surface with clear entry points into master data (CHANGE-001).
 */
export function HomePage() {
  return (
    <>
      <Title level={2} style={{ marginBottom: 8 }}>
        Ana səhifə
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 28, maxWidth: 560 }}>
        İstinad məlumatları və kataloq ekranlarına buradan keçin. Əməliyyat
        modulları növbəti hekayələrdə əlavə olunacaq.
      </Paragraph>

      <Row gutter={[16, 16]}>
        {SHORTCUTS.map((item) => (
          <Col xs={24} sm={12} lg={8} key={item.to}>
            <Link to={item.to} style={{ display: 'block', height: '100%' }}>
              <Card hoverable styles={{ body: { minHeight: 112 } }}>
                <Text strong style={{ fontSize: 16 }}>
                  {item.title}
                </Text>
                <Paragraph
                  type="secondary"
                  style={{ marginBottom: 0, marginTop: 8 }}
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
