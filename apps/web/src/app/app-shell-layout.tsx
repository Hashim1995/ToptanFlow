import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  Drawer,
  Grid,
  Layout,
  Menu,
  Space,
  Tooltip,
  Typography,
  theme,
} from "antd";
import type { MenuProps } from "antd";
import {
  ChartLine,
  CaretLeft,
  CaretRight,
  House,
  Key,
  List,
  Package,
  Ruler,
  ShoppingBag,
  ShoppingCart,
  SignOut,
  SquaresFour,
  UserCircle,
  UsersThree,
  Wallet,
  Receipt,
  ArrowsDownUp,
} from "@phosphor-icons/react";
import { MASTER_DATA_LABELS } from "../features/master-data/ui/labels";
import { AUTH_LABELS } from "../features/auth/ui/labels";
import { useAuth } from "../features/auth/use-auth";
import { CASH_LABELS } from "../features/cash/ui/labels";
import { PURCHASE_LABELS } from "../features/purchases/ui/labels";
import { SALES_LABELS } from "../features/sales/ui/labels";
import { USERS_LABELS } from "../features/users/ui/labels";
import { BrandLogo } from "../shared/ui/brand-logo";
import { ICON_SIZE, phIcon } from "../shared/ui/ph-icon";
import "./app-shell-layout.css";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

type MenuItem = Required<MenuProps>["items"][number];

function navLabel(text: string, to: string) {
  return (
    <Link to={to} className="app-nav-link">
      <span>{text}</span>
    </Link>
  );
}

const NAV_ITEMS: MenuItem[] = [
  {
    key: "group-home",
    type: "group",
    label: "Ana",
    children: [
      {
        key: "/",
        icon: phIcon(House, { size: ICON_SIZE.md }),
        label: navLabel("Ana səhifə", "/"),
      },
      {
        key: "/account",
        icon: phIcon(Key, { size: ICON_SIZE.md }),
        label: navLabel(AUTH_LABELS.accountNav, "/account"),
      },
    ],
  },
  {
    key: "group-cash",
    type: "group",
    label: CASH_LABELS.nav,
    children: [
      {
        key: "/cash/accounts",
        icon: phIcon(Wallet, { size: ICON_SIZE.md }),
        label: navLabel(CASH_LABELS.navAccounts, "/cash/accounts"),
      },
      {
        key: "/cash/transactions",
        icon: phIcon(ArrowsDownUp, { size: ICON_SIZE.md }),
        label: navLabel(CASH_LABELS.navTransactions, "/cash/transactions"),
      },
      {
        key: "/cash/reports",
        icon: phIcon(ChartLine, { size: ICON_SIZE.md }),
        label: navLabel(CASH_LABELS.navReports, "/cash/reports"),
      },
      {
        key: "/cash/expense-categories",
        icon: phIcon(Receipt, { size: ICON_SIZE.md }),
        label: navLabel(
          CASH_LABELS.expenseCategories,
          "/cash/expense-categories",
        ),
      },
    ],
  },
  {
    key: "group-purchases",
    type: "group",
    label: PURCHASE_LABELS.nav,
    children: [
      {
        key: "/purchases",
        icon: phIcon(ShoppingCart, { size: ICON_SIZE.md }),
        label: navLabel(PURCHASE_LABELS.nav, "/purchases"),
      },
    ],
  },
  {
    key: "group-sales",
    type: "group",
    label: SALES_LABELS.nav,
    children: [
      {
        key: "/sales",
        icon: phIcon(ShoppingBag, { size: ICON_SIZE.md }),
        label: navLabel(SALES_LABELS.nav, "/sales"),
      },
    ],
  },
  {
    key: "group-products",
    type: "group",
    label: "Məhsullar",
    children: [
      {
        key: "/products",
        icon: phIcon(Package, { size: ICON_SIZE.md }),
        label: navLabel(MASTER_DATA_LABELS.products.nav, "/products"),
      },
      {
        key: "/product-categories",
        icon: phIcon(SquaresFour, { size: ICON_SIZE.md }),
        label: navLabel(
          MASTER_DATA_LABELS.categories.nav,
          "/product-categories",
        ),
      },
      {
        key: "/units",
        icon: phIcon(Ruler, { size: ICON_SIZE.md }),
        label: navLabel(MASTER_DATA_LABELS.units.nav, "/units"),
      },
    ],
  },
  {
    key: "group-partners",
    type: "group",
    label: "Tərəfdaşlar",
    children: [
      {
        key: "/business-partners",
        icon: phIcon(UsersThree, { size: ICON_SIZE.md }),
        label: navLabel(MASTER_DATA_LABELS.partners.nav, "/business-partners"),
      },
    ],
  },
];

function buildNavItems(isSuperAdmin: boolean): MenuItem[] {
  if (!isSuperAdmin) {
    return NAV_ITEMS;
  }
  return [
    ...NAV_ITEMS,
    {
      key: "group-users",
      type: "group",
      label: USERS_LABELS.nav,
      children: [
        {
          key: "/users",
          icon: phIcon(UserCircle, { size: ICON_SIZE.md }),
          label: navLabel(USERS_LABELS.nav, "/users"),
        },
      ],
    },
  ];
}

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { token } = theme.useToken();

  const selectedKeys = [
    location.pathname === "/"
      ? "/"
      : location.pathname.startsWith("/account")
        ? "/account"
        : location.pathname.startsWith("/purchases")
          ? "/purchases"
          : location.pathname.startsWith("/sales")
            ? "/sales"
            : location.pathname.startsWith("/cash/expense-categories")
              ? "/cash/expense-categories"
              : location.pathname.startsWith("/cash/transactions")
                ? "/cash/transactions"
                : location.pathname.startsWith("/cash/reports")
                  ? "/cash/reports"
                  : location.pathname.startsWith("/cash")
                    ? "/cash/accounts"
                    : location.pathname.startsWith("/users")
                      ? "/users"
                      : location.pathname,
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await auth.logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  const renderMenu = (collapsed = false) => (
    <Menu
      className="app-sidebar-menu"
      mode="inline"
      inlineCollapsed={collapsed}
      selectedKeys={selectedKeys}
      items={buildNavItems(Boolean(auth.user?.isSuperAdmin))}
      onClick={() => setDrawerOpen(false)}
    />
  );

  const displayName =
    auth.user?.fullName ?? auth.user?.username ?? "İstifadəçi";
  const displayInitial = displayName
    .trim()
    .charAt(0)
    .toLocaleUpperCase("az-AZ");

  return (
    <Layout className="app-shell">
      {isDesktop ? (
        <Sider
          className={`app-sidebar${sidebarCollapsed ? " is-collapsed" : ""}`}
          width={264}
          collapsedWidth={84}
          collapsed={sidebarCollapsed}
          trigger={null}
          theme="light"
        >
          <div className="app-sidebar-inner">
            <div className="app-brand">
              <div className="app-brand-identity">
                <BrandLogo
                  className="app-sidebar-logo"
                  compact={sidebarCollapsed}
                />
              </div>
              <Tooltip
                title={sidebarCollapsed ? "Menyunu genişləndir" : "Menyunu yığ"}
                placement="right"
              >
                <Button
                  className="app-sidebar-toggle"
                  type="text"
                  aria-label={
                    sidebarCollapsed ? "Menyunu genişləndir" : "Menyunu yığ"
                  }
                  icon={phIcon(sidebarCollapsed ? CaretRight : CaretLeft, {
                    size: ICON_SIZE.sm,
                    weight: "bold",
                  })}
                  onClick={() => setSidebarCollapsed((value) => !value)}
                />
              </Tooltip>
            </div>

            <nav className="app-sidebar-navigation" aria-label="Əsas menyu">
              {renderMenu(sidebarCollapsed)}
            </nav>

            <div className="app-sidebar-user">
              <Tooltip
                title={sidebarCollapsed ? displayName : undefined}
                placement="right"
              >
                <div className="app-user-identity">
                  <Avatar className="app-user-avatar">{displayInitial}</Avatar>
                  {!sidebarCollapsed ? (
                    <div className="app-user-copy">
                      <Text strong ellipsis>
                        {displayName}
                      </Text>
                      <Text type="secondary">İstifadəçi</Text>
                    </div>
                  ) : null}
                </div>
              </Tooltip>
              <Tooltip
                title={sidebarCollapsed ? AUTH_LABELS.accountNav : undefined}
                placement="right"
              >
                <Button
                  className="app-sidebar-logout"
                  block={!sidebarCollapsed}
                  icon={phIcon(Key, { size: ICON_SIZE.md })}
                  aria-label={AUTH_LABELS.accountNav}
                  onClick={() => {
                    navigate("/account");
                    setDrawerOpen(false);
                  }}
                >
                  {!sidebarCollapsed ? AUTH_LABELS.accountNav : null}
                </Button>
              </Tooltip>
              <Tooltip
                title={sidebarCollapsed ? AUTH_LABELS.logout : undefined}
                placement="right"
              >
                <Button
                  className="app-sidebar-logout"
                  danger
                  block={!sidebarCollapsed}
                  icon={phIcon(SignOut, { size: ICON_SIZE.md })}
                  loading={loggingOut}
                  aria-label={AUTH_LABELS.logout}
                  onClick={() => void handleLogout()}
                >
                  {!sidebarCollapsed ? AUTH_LABELS.logout : null}
                </Button>
              </Tooltip>
            </div>
          </div>
        </Sider>
      ) : null}

      <Layout>
        <Header
          className="app-topbar"
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            paddingInline: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            height: 56,
            lineHeight: "56px",
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
              <BrandLogo className="app-topbar-logo" compact />
            ) : null}
          </Space>
          {!isDesktop ? (
            <Space size={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {displayName}
              </Text>
              <Button
                icon={phIcon(Key, { size: ICON_SIZE.md })}
                aria-label={AUTH_LABELS.accountNav}
                onClick={() => navigate("/account")}
              ></Button>
              <Button
                icon={phIcon(SignOut, { size: ICON_SIZE.md })}
                loading={loggingOut}
                aria-label={AUTH_LABELS.logout}
                onClick={() => void handleLogout()}
              ></Button>
            </Space>
          ) : null}
        </Header>
        <Content
          className="app-content"
          style={{ padding: isDesktop ? 24 : 16 }}
        >
          <div className="app-content-inner">
            <Outlet />
          </div>
        </Content>
      </Layout>

      <Drawer
        className="app-nav-drawer"
        title={<BrandLogo className="app-drawer-logo" compact />}
        placement="left"
        width={320}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <div className="app-drawer-navigation">{renderMenu()}</div>
        <div className="app-drawer-user">
          <Avatar className="app-user-avatar">{displayInitial}</Avatar>
          <div className="app-user-copy">
            <Text strong ellipsis>
              {displayName}
            </Text>
            <Text type="secondary">İstifadəçi</Text>
          </div>
        </div>
      </Drawer>
    </Layout>
  );
}
