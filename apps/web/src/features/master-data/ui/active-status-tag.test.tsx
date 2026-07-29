import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActiveStatusTag } from './active-status-tag';
import { MASTER_DATA_LABELS } from './labels';

vi.mock('antd', () => ({
  Tag: ({ children }: { children?: React.ReactNode }) => (
    <span data-testid="tag">{children}</span>
  ),
}));

describe('ActiveStatusTag', () => {
  it('shows Azerbaijani active label', () => {
    render(<ActiveStatusTag isActive />);
    expect(screen.getByText(MASTER_DATA_LABELS.common.active)).toBeInTheDocument();
  });

  it('shows Azerbaijani inactive label', () => {
    render(<ActiveStatusTag isActive={false} />);
    expect(
      screen.getByText(MASTER_DATA_LABELS.common.inactive),
    ).toBeInTheDocument();
  });
});
