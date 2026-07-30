import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Drawer,
  Grid,
  Layout,
  Menu,
  Space,
  Typography,
  theme,
} from 'antd';
import type { MenuProps } from 'antd';
import { LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { MASTER_DATA_LABELS } from '../features/master-data/ui/labels';
import { AUTH_LABELS } from '../features/auth/ui/labels';
import { useAuth } from '../features/auth/use-auth';

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
      {
        key: '/warehouses',
        label: (
          <Link to="/warehouses">{MASTER_DATA_LABELS.warehouses.nav}</Link>
        ),
      },
    ],
  },
];

/**
 * Responsive app chrome (US-037 / TASK-037-03; uplifted CHANGE-001 / US-042).
 * Desktop: sider with grouped nav. Mobile: header button + drawer.
 * Logout: US-019 / ADR-025.
 */
export function AppShellLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const screens = Grid.useBreakpoint();
  const isDesktop = Boolean(screens.md);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { token } = theme.useToken();

  const selectedKeys = [location.pathname === '/' ? '/' : location.pathname];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await auth.logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

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
          <Space>
            {auth.user ? (
              <Text type="secondary" ellipsis style={{ maxWidth: 160 }}>
                {auth.user.fullName}
              </Text>
            ) : null}
            <Button
              type="default"
              icon={<LogoutOutlined />}
              loading={loggingOut}
              onClick={() => void handleLogout()}
            >
              {AUTH_LABELS.logout}
            </Button>
          </Space>
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
