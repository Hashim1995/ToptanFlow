import { render, screen } from '@testing-library/react';
import { ConfigProvider, Grid } from 'antd';
import { describe, expect, it, vi } from 'vitest';
import { ResponsiveDatePicker } from './responsive-date-picker';

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    Grid: {
      ...actual.Grid,
      useBreakpoint: () => ({ md: false, lg: false, xl: false }),
    },
  };
});

describe('ResponsiveDatePicker', () => {
  it('renders a date input on mobile breakpoints', () => {
    render(
      <ConfigProvider>
        <ResponsiveDatePicker aria-label="Tarix" />
      </ConfigProvider>,
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    // Grid mock keeps md false; desktop popup path is not used.
    expect(Grid.useBreakpoint().md).toBe(false);
  });
});
