import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BrandLogo } from './brand-logo';

describe('BrandLogo', () => {
  afterEach(() => {
    cleanup();
  });

  it('uses the full wordmark by default', () => {
    render(<BrandLogo />);

    expect(screen.getByAltText('TOPTANFLOW')).toHaveAttribute(
      'src',
      '/toptanflow-logo.png',
    );
  });

  it('uses the mobile mark asset in compact contexts', () => {
    const { container } = render(<BrandLogo compact />);

    expect(screen.getByAltText('TOPTANFLOW')).toHaveAttribute(
      'src',
      '/toptan-flow-mobile-logo.png',
    );
    expect(container.firstChild).toHaveClass('toptanflow-logo-compact');
  });
});
