import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

/**
 * Placeholder home only — no domain feature screens (US-038+).
 */
export function HomePage() {
  return (
    <>
      <Title level={2}>Ana səhifə</Title>
      <Paragraph>
        İnterfeys quruluşu hazırlanır. Əməliyyat ekranları ayrıca hekayələrdə
        əlavə olunacaq.
      </Paragraph>
    </>
  );
}
