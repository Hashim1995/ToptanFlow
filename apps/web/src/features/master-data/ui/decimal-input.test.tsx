import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  type ChangeEvent,
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
    ...rest
  }: InputHTMLAttributes<HTMLInputElement>) => (
    <input
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange?.(event)}
      {...rest}
    />
  ),
}));

function ControlledDecimalInput({
  onChange,
}: {
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  return (
    <DecimalInput
      aria-label="decimal"
      value={value}
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

  it('rejects a second decimal point via sanitize', async () => {
    const user = userEvent.setup();
    render(<ControlledDecimalInput />);

    const input = screen.getByLabelText('decimal');
    await user.type(input, '1.2.3');

    expect(input).toHaveValue('1.23');
  });
});
