import { useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Avatar,
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
import {
  House,
  List,
  Package,
  Ruler,
  ShoppingBag,
  ShoppingCart,
  SignOut,
  SquaresFour,
  UsersThree,
} from '@phosphor-icons/react';
import { MASTER_DATA_LABELS } from '../features/master-data/ui/labels';
import { AUTH_LABELS } from '../features/auth/ui/labels';
import { useAuth } from '../features/auth/use-auth';
import { PURCHASE_LABELS } from '../features/purchases/ui/labels';
import { SALES_LABELS } from '../features/sales/ui/labels';
import { ICON_SIZE, phIcon } from '../shared/ui/ph-icon';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

type MenuItem = Required<MenuProps>['items'][number];

function navLabel(icon: ReactNode, text: string, to: string) {
  return (
    <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon}
      <span>{text}</span>
    </Link>
  );
}

const NAV_ITEMS: MenuItem[] = [
  {
    key: 'group-home',
    type: 'group',
    label: 'Ana',
    children: [
      {
        key: '/',
        label: navLabel(
          phIcon(House, { size: ICON_SIZE.md }),
          'Ana səhifə',
          '/',
        ),
      },
    ],
  },
  {
    key: 'group-products',
    type: 'group',
    label: 'Məhsullar',
    children: [
      {
        key: '/products',
        label: navLabel(
          phIcon(Package, { size: ICON_SIZE.md }),
          MASTER_DATA_LABELS.products.nav,
          '/products',
        ),
      },
      {
        key: '/product-categories',
        label: navLabel(
          phIcon(SquaresFour, { size: ICON_SIZE.md }),
          MASTER_DATA_LABELS.categories.nav,
          '/product-categories',
        ),
      },
      {
        key: '/units',
        label: navLabel(
          phIcon(Ruler, { size: ICON_SIZE.md }),
          MASTER_DATA_LABELS.units.nav,
          '/units',
        ),
      },
    ],
  },
  {
    key: 'group-partners',
    type: 'group',
    label: 'Tərəfdaşlar',
    children: [
      {
        key: '/business-partners',
        label: navLabel(
          phIcon(UsersThree, { size: ICON_SIZE.md }),
          MASTER_DATA_LABELS.partners.nav,
          '/business-partners',
        ),
      },
    ],
  },
  {
    key: 'group-purchases',
    type: 'group',
    label: PURCHASE_LABELS.nav,
    children: [
      {
        key: '/purchases',
        label: navLabel(
          phIcon(ShoppingCart, { size: ICON_SIZE.md }),
          PURCHASE_LABELS.nav,
          '/purchases',
        ),
      },
    ],
  },
  {
    key: 'group-sales',
    type: 'group',
    label: SALES_LABELS.nav,
    children: [
      {
        key: '/sales',
        label: navLabel(
          phIcon(ShoppingBag, { size: ICON_SIZE.md }),
          SALES_LABELS.nav,
          '/sales',
        ),
      },
    ],
  },
];

/**
 * Responsive app chrome (US-037 / TASK-037-03; uplifted CHANGE-001 / US-042).
 * Navigation simplified under ADR-029 / ADR-031 (no Warehouse / Inventar / Currency).
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

  const selectedKeys = [
    location.pathname === '/'
      ? '/'
      : location.pathname.startsWith('/purchases')
        ? '/purchases'
        : location.pathname.startsWith('/sales')
          ? '/sales'
          : location.pathname,
  ];

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

  const displayName = auth.user?.fullName ?? auth.user?.username ?? 'İstifadəçi';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isDesktop ? (
        <Sider
          width={248}
          style={{
            background: token.colorBgContainer,
            borderInlineEnd: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div style={{ padding: '16px 16px 8px' }}>
            <Space align="center" size={10}>
              <Avatar
                shape="square"
                style={{
                  background: token.colorPrimary,
                  borderRadius: 8,
                  fontWeight: 700,
                }}
              >
                TF
              </Avatar>
              <div>
                <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>
                  TOPTANFLOW
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  İdarə paneli
                </Text>
              </div>
            </Space>
          </div>
          {menu}
        </Sider>
      ) : null}

      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            paddingInline: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            height: 56,
            lineHeight: '56px',
          }}
        >
          <Space>
            {!isDesktop ? (
              <Button
                type="text"
                icon={phIcon(List, { size: ICON_SIZE.lg })}
                aria-label="Menyu"
                onClick={() => setDrawerOpen(true)}
              />
            ) : null}
            {!isDesktop ? (
              <Title level={5} style={{ margin: 0 }}>
                TOPTANFLOW
              </Title>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {displayName}
              </Text>
            )}
          </Space>
          <Space size={8}>
            {!isDesktop ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {displayName}
              </Text>
            ) : null}
            <Button
              icon={phIcon(SignOut, { size: ICON_SIZE.md })}
              loading={loggingOut}
              onClick={() => void handleLogout()}
            >
              {AUTH_LABELS.logout}
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: isDesktop ? 24 : 16 }}>
          <Outlet />
        </Content>
      </Layout>

      <Drawer
        title={
          <Space>
            {phIcon(List, { size: ICON_SIZE.md })}
            Menyu
          </Space>
        }
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {menu}
      </Drawer>
    </Layout>
  );
}
