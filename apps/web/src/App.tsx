import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShellLayout } from './app/app-shell-layout';
import { HomePage } from './pages/home-page';

/**
 * App routes — home only until feature stories activate screens (US-038+).
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShellLayout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
