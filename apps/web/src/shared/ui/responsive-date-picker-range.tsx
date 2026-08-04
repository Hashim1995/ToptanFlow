import type { CSSProperties } from 'react';
import type { Dayjs } from 'dayjs';
import { DATE_DISPLAY_FORMAT } from '../datetime';
import { ResponsiveDatePicker } from './responsive-date-picker';
import './responsive-date-picker.css';

export type DateRangeValue = [Dayjs | null, Dayjs | null] | null;

export type ResponsiveRangePickerProps = {
  value?: DateRangeValue;
  format?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  startPlaceholder?: string;
  endPlaceholder?: string;
  onChange?: (dates: DateRangeValue) => void;
};

function emitRange(
  start: Dayjs | null,
  end: Dayjs | null,
  onChange?: (dates: DateRangeValue) => void,
) {
  if (!start && !end) {
    onChange?.(null);
    return;
  }
  onChange?.([start, end]);
}

/**
 * Date range as two independent single date pickers (start + end).
 * Used everywhere a range filter was previously a RangePicker.
 */
export function ResponsiveRangePicker({
  value = null,
  format = DATE_DISPLAY_FORMAT,
  allowClear = true,
  disabled,
  className,
  style,
  startPlaceholder = 'Başlanğıc tarixi',
  endPlaceholder = 'Bitmə tarixi',
  onChange,
}: ResponsiveRangePickerProps) {
  const start = value?.[0] ?? null;
  const end = value?.[1] ?? null;

  return (
    <div
      className={['responsive-date-range-fields', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <ResponsiveDatePicker
        value={start}
        format={format}
        allowClear={allowClear}
        disabled={disabled}
        placeholder={startPlaceholder}
        style={{ width: '100%' }}
        onChange={(next) => emitRange(next, end, onChange)}
      />
      <ResponsiveDatePicker
        value={end}
        format={format}
        allowClear={allowClear}
        disabled={disabled}
        placeholder={endPlaceholder}
        style={{ width: '100%' }}
        onChange={(next) => emitRange(start, next, onChange)}
      />
    </div>
  );
}
