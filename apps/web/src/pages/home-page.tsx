import { Card, Col, Row, Space, Typography } from "antd";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowsLeftRight,
  Package,
  Ruler,
  ShoppingBag,
  ShoppingCart,
  SquaresFour,
  UsersThree,
  Wallet,
  Receipt,
} from "@phosphor-icons/react";
import { CASH_LABELS } from "../features/cash/ui/labels";
import { MASTER_DATA_LABELS } from "../features/master-data/ui/labels";
import { PURCHASE_LABELS } from "../features/purchases/ui/labels";
import { SALES_LABELS } from "../features/sales/ui/labels";
import { ICON_SIZE, phIcon } from "../shared/ui/ph-icon";
import "./home-page.css";

const { Title, Paragraph, Text } = Typography;

const QUICK_ACTIONS = [
  {
    to: "/cash/accounts?action=cash-in",
    title: CASH_LABELS.cashIn,
    description: "Tərəfdaşdan ödəniş qəbul et",
    icon: ArrowDown,
    tone: "in",
  },
  {
    to: "/cash/accounts?action=cash-out",
    title: CASH_LABELS.cashOut,
    description: "Tərəfdaşa ödəniş et",
    icon: ArrowUp,
    tone: "out",
  },
  {
    to: "/purchases?action=create",
    title: "Yeni alış",
    description: "Alış sənədi yarat",
    icon: ShoppingCart,
    tone: "purchase",
  },
  {
    to: "/sales?action=create",
    title: "Yeni satış",
    description: "Satış sənədi yarat",
    icon: ShoppingBag,
    tone: "sale",
  },
  {
    to: "/cash/accounts?action=expense",
    title: CASH_LABELS.expense,
    description: "Biznes xərcini qeyd et",
    icon: Receipt,
    tone: "expense",
  },
  {
    to: "/cash/accounts?action=transfer",
    title: CASH_LABELS.transfer,
    description: "Hesablar arasında köçür",
    icon: ArrowsLeftRight,
    tone: "transfer",
  },
] as const;

const SHORTCUTS = [
  {
    to: "/cash/accounts",
    title: CASH_LABELS.nav,
    description: "Kassa hesabları, mədaxil və məxaric əməliyyatları",
    icon: Wallet,
    color: "#faad14",
  },
  {
    to: "/sales",
    title: SALES_LABELS.nav,
    description: "Satış qaralamaları, təsdiq və ləğv əməliyyatları",
    icon: ShoppingBag,
    color: "#eb2f96",
  },
  {
    to: "/purchases",
    title: PURCHASE_LABELS.nav,
    description: "Alış qaralamaları, təsdiq və ləğv əməliyyatları",
    icon: ShoppingCart,
    color: "#1677ff",
  },
  {
    to: "/products",
    title: MASTER_DATA_LABELS.products.nav,
    description: "Məhsul kataloqu, cari miqdar və qiymət məlumatları",
    icon: Package,
    color: "#13c2c2",
  },
  {
    to: "/business-partners",
    title: MASTER_DATA_LABELS.partners.nav,
    description: "Müştəri və təchizatçı qeydləri",
    icon: UsersThree,
    color: "#722ed1",
  },
  {
    to: "/product-categories",
    title: MASTER_DATA_LABELS.categories.nav,
    description: "Məhsul kateqoriyaları",
    icon: SquaresFour,
    color: "#fa8c16",
  },
  {
    to: "/units",
    title: MASTER_DATA_LABELS.units.nav,
    description: "Ölçü vahidləri",
    icon: Ruler,
    color: "#52c41a",
  },
] as const;

/**
 * Landing surface with clear entry points (CHANGE-001; ADR-029 / ADR-031).
 */
export function HomePage() {
  return (
    <div className="home-page">
      <div className="home-hero">
        <Title className="home-title" level={2}>
          Ana səhifə
        </Title>
      </div>

      <section
        className="home-quick-section"
        aria-labelledby="quick-actions-title"
      >
        <div className="home-section-heading">
          <div>
            <Title id="quick-actions-title" level={4}>
              Sürətli əməliyyatlar
            </Title>
          </div>
        </div>
        <div className="home-quick-grid">
          {QUICK_ACTIONS.map((item) => (
            <Link key={item.to} className="home-quick-link" to={item.to}>
              <Card
                className={`home-quick-card is-${item.tone}`}
                hoverable
                size="small"
              >
                <span className="home-quick-icon" aria-hidden="true">
                  {phIcon(item.icon, { size: ICON_SIZE.lg, weight: "duotone" })}
                </span>
                <span className="home-quick-copy">
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </span>
                <span className="home-quick-arrow" aria-hidden="true">
                  {phIcon(ArrowRight, { size: ICON_SIZE.sm, weight: "bold" })}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Row className="home-shortcuts" gutter={[16, 16]}>
        {SHORTCUTS.map((item) => (
          <Col xs={24} sm={12} lg={8} key={item.to}>
            <Link className="home-shortcut-link" to={item.to}>
              <Card
                className="home-shortcut-card"
                hoverable
                styles={{
                  body: {
                    minHeight: 128,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  },
                }}
              >
                <Space
                  className="home-shortcut-top"
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <span
                    className="home-shortcut-icon"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `${item.color}14`,
                      color: item.color,
                    }}
                  >
                    {phIcon(item.icon, {
                      size: ICON_SIZE.xl,
                      weight: "duotone",
                    })}
                  </span>
                  {phIcon(ArrowRight, { size: ICON_SIZE.sm })}
                </Space>
                <Text className="home-shortcut-title" strong>
                  {item.title}
                </Text>
                <Paragraph
                  className="home-shortcut-description"
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
    </div>
  );
}
