import type { ChangeEvent, ComponentProps } from 'react';
import { Input } from 'antd';
import { sanitizeDecimalInput } from './sanitize-decimal-input';

type DecimalInputProps = Omit<
  ComponentProps<typeof Input>,
  'type' | 'inputMode' | 'onChange' | 'value'
> & {
  value?: string;
  onChange?: (value: string) => void;
};

export function DecimalInput({
  value,
  onChange,
  placeholder = '0.0000',
  ...rest
}: DecimalInputProps) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(sanitizeDecimalInput(event.target.value));
  }

  return (
    <Input
      {...rest}
      value={value ?? ''}
      onChange={handleChange}
      inputMode="decimal"
      autoComplete="off"
      placeholder={placeholder}
    />
  );
}
