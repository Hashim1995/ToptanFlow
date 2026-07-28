import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShellLayout } from './app/app-shell-layout';
import { BusinessPartnersPage } from './features/master-data/pages/business-partners-page';
import { CurrenciesPage } from './features/master-data/pages/currencies-page';
import { ProductsPage } from './features/master-data/pages/products-page';
import { UnitsPage } from './features/master-data/pages/units-page';
import { HomePage } from './pages/home-page';

/**
 * App routes — shell + master-data screens (US-038).
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShellLayout />}>
          <Route index element={<HomePage />} />
          <Route path="currencies" element={<CurrenciesPage />} />
          <Route path="units" element={<UnitsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="business-partners" element={<BusinessPartnersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
