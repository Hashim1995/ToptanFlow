import './brand-logo.css';

type BrandLogoProps = {
  className?: string;
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
        src="/toptanflow-logo.png"
        alt="TOPTANFLOW"
        decoding="async"
        draggable={false}
      />
    </span>
  );
}
