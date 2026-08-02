import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandLogo } from './brand-logo';

describe('BrandLogo', () => {
  it('uses the official TOPTANFLOW asset in compact and responsive contexts', () => {
    const { container } = render(<BrandLogo compact />);

    expect(screen.getByAltText('TOPTANFLOW')).toHaveAttribute(
      'src',
      '/toptanflow-logo.png',
    );
    expect(container.firstChild).toHaveClass('toptanflow-logo-compact');
  });
});
