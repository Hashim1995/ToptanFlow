import type { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import azAZ from 'antd/locale/az_AZ';
import { store } from './store';
import { queryClient } from './query-client';

type AppProvidersProps = {
  children: ReactNode;
};

/**
 * Root providers for the TOPTANFLOW web shell (US-037 / TASK-037-01).
 * Ant Design Azerbaijani locale (ADR-005, ADR-009); RTK (ADR-011);
 * TanStack Query (ADR-016). Theme uses Ant Design defaults.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={azAZ}>{children}</ConfigProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
