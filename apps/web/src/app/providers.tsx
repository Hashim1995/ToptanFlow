import type { ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme as antdTheme } from 'antd';
import azAZ from 'antd/locale/az_AZ';
import { store } from './store';
import { queryClient } from './query-client';

type AppProvidersProps = {
  children: ReactNode;
};

/**
 * Root providers for the TOPTANFLOW web shell (US-037 / TASK-037-01).
 * Ant Design Azerbaijani locale (ADR-005, ADR-009); RTK (ADR-011);
 * TanStack Query (ADR-016). Theme tokens tuned for CHANGE-001 UX bar.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          locale={azAZ}
          theme={{
            algorithm: antdTheme.defaultAlgorithm,
            token: {
              borderRadius: 8,
              controlHeight: 36,
              fontSize: 14,
              colorPrimary: '#0f6e56',
              colorInfo: '#0f6e56',
              colorLink: '#0f6e56',
              colorBgLayout: '#f4f7f6',
              fontFamily:
                '"Segoe UI", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            },
            components: {
              Layout: {
                headerBg: '#ffffff',
                siderBg: '#ffffff',
                bodyBg: '#f4f7f6',
              },
              Menu: {
                itemBorderRadius: 8,
              },
              Card: {
                borderRadiusLG: 10,
              },
            },
          }}
        >
          {children}
        </ConfigProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
