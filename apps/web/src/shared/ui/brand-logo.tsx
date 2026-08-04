import './brand-logo.css';

const FULL_LOGO_SRC = '/toptanflow-logo.png';
const MARK_LOGO_SRC = '/toptan-flow-mobile-logo.png';

type BrandLogoProps = {
  className?: string;
  /** Square mark for collapsed sidebar, mobile top bar, and drawer. */
  compact?: boolean;
};

export function BrandLogo({ className = '', compact = false }: BrandLogoProps) {
  return (
    <span
      className={[
        'toptanflow-logo',
        compact ? 'toptanflow-logo-compact' : 'toptanflow-logo-full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        src={compact ? MARK_LOGO_SRC : FULL_LOGO_SRC}
        alt="TOPTANFLOW"
        decoding="async"
        draggable={false}
      />
    </span>
  );
}
