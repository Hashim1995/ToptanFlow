import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  type ChangeEvent,
  type FocusEventHandler,
  type InputHTMLAttributes,
  useState,
} from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DecimalInput } from './decimal-input';

afterEach(cleanup);

vi.mock('antd', () => ({
  Input: ({
    value,
    onChange,
    onBlur,
    ...rest
  }: InputHTMLAttributes<HTMLInputElement> & {
    onBlur?: FocusEventHandler<HTMLInputElement>;
  }) => (
    <input
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange?.(event)}
      onBlur={onBlur}
      {...rest}
    />
  ),
}));

function ControlledDecimalInput({
  onChange,
  maxFractionDigits,
}: {
  onChange?: (value: string) => void;
  maxFractionDigits?: number;
}) {
  const [value, setValue] = useState('');
  return (
    <DecimalInput
      aria-label="decimal"
      value={value}
      maxFractionDigits={maxFractionDigits}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe('DecimalInput', () => {
  it('sanitizes typed input to digits and one decimal point', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledDecimalInput onChange={onChange} />);

    const input = screen.getByLabelText('decimal');
    await user.type(input, '12.34ab5');

    expect(onChange).toHaveBeenCalled();
    expect(input).toHaveValue('12.345');
  });

  it('accepts comma decimals and normalizes them to a dot', async () => {
    const user = userEvent.setup();
    render(<ControlledDecimalInput />);

    const input = screen.getByLabelText('decimal');
    await user.type(input, '12,5');

    expect(input).toHaveValue('12.5');
  });

  it('rejects a second decimal point via sanitize', async () => {
    const user = userEvent.setup();
    render(<ControlledDecimalInput />);

    const input = screen.getByLabelText('decimal');
    await user.type(input, '1.2.3');

    expect(input).toHaveValue('1.23');
  });

  it('finalizes money values to two decimals on blur', async () => {
    const user = userEvent.setup();
    render(<ControlledDecimalInput maxFractionDigits={2} />);

    const input = screen.getByLabelText('decimal');
    await user.type(input, '12,5');
    await user.tab();

    expect(input).toHaveValue('12.50');
  });
});
