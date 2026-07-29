import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShellLayout } from './app/app-shell-layout';
import { RequireAuth } from './features/auth/require-auth';
import { LoginPage } from './features/auth/pages/login-page';
import { BusinessPartnersPage } from './features/master-data/pages/business-partners-page';
import { CurrenciesPage } from './features/master-data/pages/currencies-page';
import { ProductCategoriesPage } from './features/master-data/pages/product-categories-page';
import { ProductsPage } from './features/master-data/pages/products-page';
import { UnitsPage } from './features/master-data/pages/units-page';
import { HomePage } from './pages/home-page';

/**
 * App routes — auth gate (US-019) + master-data screens.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShellLayout />}>
            <Route index element={<HomePage />} />
            <Route path="currencies" element={<CurrenciesPage />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
