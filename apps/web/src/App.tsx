import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

/**
 * Placeholder home only — no domain feature screens (US-038+).
 */
function App() {
  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <Title level={2}>TOPTANFLOW</Title>
      <Paragraph>
        İnterfeys quruluşu hazırlanır. Əməliyyat ekranları ayrıca hekayələrdə
        əlavə olunacaq.
      </Paragraph>
    </main>
  );
}

export default App;
