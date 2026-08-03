import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './shared/datetime';
import { AppProviders } from './app/providers';
import App from './App';
import './index.css';
import './shared/ui/mobile-modal.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
