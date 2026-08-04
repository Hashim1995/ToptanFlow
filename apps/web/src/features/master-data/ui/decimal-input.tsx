import type { ChangeEvent, ComponentProps, FocusEvent } from 'react';
import { Input } from 'antd';
import {
  formatMoneyInput,
  normalizeDecimalInput,
} from '../../../shared/decimal';

type DecimalInputProps = Omit<
  ComponentProps<typeof Input>,
  'type' | 'inputMode' | 'onChange' | 'value'
> & {
  value?: string;
  onChange?: (value: string) => void;
  /** Max digits after `.` (money: 2, quantity: 4). */
  maxFractionDigits?: number;
};

/**
 * Text decimal field that accepts `,` or `.` while typing, keeps form state
 * in canonical dot-decimal form, and finalizes money to `0.00` on blur.
 */
export function DecimalInput({
  value,
  onChange,
  onBlur,
  placeholder = '0.0000',
  maxFractionDigits = 4,
  ...rest
}: DecimalInputProps) {
  const isMoney = maxFractionDigits === 2;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(normalizeDecimalInput(event.target.value, maxFractionDigits));
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    const current = value ?? '';
    if (!current.trim()) return;

    if (isMoney) {
      const formatted = formatMoneyInput(current);
      if (formatted && formatted !== current) {
        onChange?.(formatted);
      }
      return;
    }

    const normalized = normalizeDecimalInput(current, maxFractionDigits);
    // Drop a trailing separator for non-money fields (`12.` → `12`).
    const finalized = normalized.endsWith('.')
      ? normalized.slice(0, -1)
      : normalized;
    if (finalized !== current) {
      onChange?.(finalized);
    }
  }

  return (
    <Input
      {...rest}
      type="text"
      value={value ?? ''}
      onChange={handleChange}
      onBlur={handleBlur}
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
    />
  );
}
