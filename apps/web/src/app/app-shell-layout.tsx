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
import { MenuOutlined } from '@ant-design/icons';
import { MASTER_DATA_LABELS } from '../features/master-data/ui/labels';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const NAV_ITEMS = [
  {
    key: '/',
    label: <Link to="/">Ana səhifə</Link>,
  },
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
    key: '/products',
    label: <Link to="/products">{MASTER_DATA_LABELS.products.nav}</Link>,
  },
  {
    key: '/business-partners',
    label: (
      <Link to="/business-partners">{MASTER_DATA_LABELS.partners.nav}</Link>
    ),
  },
];

/**
 * Responsive app chrome (US-037 / TASK-037-03).
 * Desktop: sider. Mobile: header button + drawer (no hover-only nav).
 * Master-data nav entries added with US-038 screens.
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
          width={220}
          theme="light"
          style={{ borderInlineEnd: `1px solid ${token.colorBorderSecondary}` }}
        >
          <div style={{ padding: '16px 16px 8px' }}>
            <Title level={4} style={{ margin: 0 }}>
              TOPTANFLOW
            </Title>
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
            paddingInline: 16,
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
          <Title level={4} style={{ margin: 0, flex: 1 }}>
            TOPTANFLOW
          </Title>
        </Header>

        <Content style={{ padding: 24 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>

      <Drawer
        title="Naviqasiya"
        placement="left"
        open={!isDesktop && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {menu}
      </Drawer>
    </Layout>
  );
}
