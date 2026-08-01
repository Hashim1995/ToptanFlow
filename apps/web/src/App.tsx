import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShellLayout } from './app/app-shell-layout';
import { RequireAuth } from './features/auth/require-auth';
import { RequireSuperAdmin } from './features/auth/require-super-admin';
import { LoginPage } from './features/auth/pages/login-page';
import { CashAccountDetailPage } from './features/cash/pages/cash-account-detail-page';
import { CashAccountsPage } from './features/cash/pages/cash-accounts-page';
import { CashReportsPage } from './features/cash/pages/cash-reports-page';
import { ExpenseCategoriesPage } from './features/cash/pages/expense-categories-page';
import { BusinessPartnersPage } from './features/master-data/pages/business-partners-page';
import { ProductCategoriesPage } from './features/master-data/pages/product-categories-page';
import { ProductsPage } from './features/master-data/pages/products-page';
import { UnitsPage } from './features/master-data/pages/units-page';
import { PurchaseDetailPage } from './features/purchases/pages/purchase-detail-page';
import { PurchasesPage } from './features/purchases/pages/purchases-page';
import { SaleDetailPage } from './features/sales/pages/sale-detail-page';
import { SalesPage } from './features/sales/pages/sales-page';
import { UsersPage } from './features/users/pages/users-page';
import { HomePage } from './pages/home-page';

/**
 * App routes — auth gate (US-019) + master-data / purchase / sale / cash screens.
 * Users admin is Super Admin only (ADR-039 / US-051).
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShellLayout />}>
            <Route index element={<HomePage />} />
            <Route path="units" element={<UnitsPage />} />
            <Route
              path="product-categories"
              element={<ProductCategoriesPage />}
            />
            <Route path="products" element={<ProductsPage />} />
            <Route
              path="business-partners"
              element={<BusinessPartnersPage />}
            />
            <Route path="purchases" element={<PurchasesPage />} />
            <Route path="purchases/:id" element={<PurchaseDetailPage />} />
            <Route path="sales" element={<SalesPage />} />
            <Route path="sales/:id" element={<SaleDetailPage />} />
            <Route path="cash/accounts" element={<CashAccountsPage />} />
            <Route
              path="cash/accounts/:id"
              element={<CashAccountDetailPage />}
            />
            <Route path="cash/reports" element={<CashReportsPage />} />
            <Route
              path="cash/expense-categories"
              element={<ExpenseCategoriesPage />}
            />
            <Route element={<RequireSuperAdmin />}>
              <Route path="users" element={<UsersPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
