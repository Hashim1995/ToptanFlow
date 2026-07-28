import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Button,
  Drawer,
  Grid,
  Layout,
  Menu,
  Typography,
  theme,
} from 'antd';
import type { MenuProps } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { MASTER_DATA_LABELS } from '../features/master-data/ui/labels';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

const NAV_ITEMS: MenuItem[] = [
  {
    key: 'group-home',
    type: 'group',
    label: 'Ana',
    children: [
      {
        key: '/',
        label: <Link to="/">Ana səhifə</Link>,
      },
    ],
  },
  {
    key: 'group-reference',
    type: 'group',
    label: 'İstinad məlumatları',
    children: [
      {
        key: '/currencies',
        label: (
          <Link to="/currencies">{MASTER_DATA_LABELS.currencies.nav}</Link>
        ),
      },
      {
        key: '/units',
        label: <Link to="/units">{MASTER_DATA_LABELS.units.nav}</Link>,
      },
      {
        key: '/product-categories',
        label: (
          <Link to="/product-categories">
            {MASTER_DATA_LABELS.categories.nav}
          </Link>
        ),
      },
    ],
  },
  {
    key: 'group-catalog',
    type: 'group',
    label: 'Kataloq',
    children: [
      {
        key: '/products',
        label: <Link to="/products">{MASTER_DATA_LABELS.products.nav}</Link>,
      },
      {
        key: '/business-partners',
        label: (
          <Link to="/business-partners">
            {MASTER_DATA_LABELS.partners.nav}
          </Link>
        ),
      },
    ],
  },
];

/**
 * Responsive app chrome (US-037 / TASK-037-03; uplifted CHANGE-001 / US-042).
 * Desktop: sider with grouped nav. Mobile: header button + drawer.
 */
export function AppShellLayout() {
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { token } = theme.useToken();

  const selectedKeys = [location.pathname === '/' ? '/' : location.pathname];

  const menu = (
    <Menu
      mode="inline"
      selectedKeys={selectedKeys}
      items={NAV_ITEMS}
      onClick={() => setDrawerOpen(false)}
      style={{ borderInlineEnd: 'none' }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isDesktop ? (
        <Sider
          breakpoint="md"
          collapsedWidth={0}
          width={248}
          theme="light"
          style={{
            borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
            paddingBottom: 24,
          }}
        >
          <div style={{ padding: '20px 20px 12px' }}>
            <Title level={4} style={{ margin: 0, letterSpacing: '0.02em' }}>
              TOPTANFLOW
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Topdan satış əməliyyatları
            </Text>
          </div>
          {menu}
        </Sider>
      ) : null}

      <Layout>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            paddingInline: isDesktop ? 28 : 16,
            height: 64,
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {!isDesktop ? (
            <Button
              type="text"
              icon={<MenuOutlined />}
              aria-label="Menyunu aç"
              onClick={() => setDrawerOpen(true)}
            />
          ) : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <Title level={4} style={{ margin: 0 }}>
              TOPTANFLOW
            </Title>
          </div>
        </Header>

        <Content
          style={{
            padding: isDesktop ? '28px 32px 40px' : '20px 16px 32px',
          }}
        >
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>

      <Drawer
        title="Naviqasiya"
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { paddingInline: 0 } }}
      >
        {menu}
      </Drawer>
    </Layout>
  );
}
