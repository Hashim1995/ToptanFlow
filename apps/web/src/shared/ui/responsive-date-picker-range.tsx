import { useMemo, useState, type ComponentProps } from 'react';
import { Button, DatePicker, Drawer, Grid } from 'antd';
import type { Dayjs } from 'dayjs';
import { DATE_DISPLAY_FORMAT } from '../datetime';
import { PWA_LABELS } from '../pwa/labels';
import './responsive-date-picker.css';

type AntRangePickerProps = ComponentProps<typeof DatePicker.RangePicker>;
type RangeValue = [Dayjs | null, Dayjs | null] | null;

export type ResponsiveRangePickerProps = Omit<
  AntRangePickerProps,
  'value' | 'onChange' | 'format'
> & {
  value?: RangeValue;
  format?: string;
  onChange?: (dates: RangeValue, dateStrings: [string, string]) => void;
};

function useIsMobileDatePicker(): boolean {
  const screens = Grid.useBreakpoint();
  return !screens.md;
}

function formatRangeDraft(value: RangeValue, format: string): [string, string] {
  return [
    value?.[0] ? value[0].format(format) : '',
    value?.[1] ? value[1].format(format) : '',
  ];
}

/**
 * Desktop: standard Ant RangePicker popup.
 * Mobile: bottom drawer with an inline range panel.
 */
export function ResponsiveRangePicker({
  format = DATE_DISPLAY_FORMAT,
  value = null,
  onChange,
  ...props
}: ResponsiveRangePickerProps) {
  const isMobile = useIsMobileDatePicker();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RangeValue>(null);

  const panelValue = useMemo(() => {
    if (open) return draft;
    return value;
  }, [draft, open, value]);

  if (!isMobile) {
    return (
      <DatePicker.RangePicker
        {...props}
        format={format}
        value={value}
        onChange={(next) => {
          onChange?.(next ?? null, formatRangeDraft(next ?? null, format));
        }}
      />
    );
  }

  return (
    <>
      <DatePicker.RangePicker
        {...props}
        format={format}
        value={value}
        inputReadOnly
        open={false}
        onOpenChange={(next) => {
          if (next && !props.disabled) {
            setDraft(value);
            setOpen(true);
          }
        }}
        onClick={() => {
          if (!props.disabled) {
            setDraft(value);
            setOpen(true);
          }
        }}
      />
      <Drawer
        open={open}
        placement="bottom"
        size="auto"
        title={PWA_LABELS.rangePickerTitle}
        onClose={() => setOpen(false)}
        destroyOnHidden
        className="responsive-date-picker-drawer"
        styles={{
          body: { paddingTop: 8, paddingBottom: 8 },
        }}
        footer={
          <div className="responsive-date-picker-footer">
            <Button onClick={() => setOpen(false)}>
              {PWA_LABELS.datePickerCancel}
            </Button>
            <Button
              type="primary"
              onClick={() => {
                onChange?.(draft, formatRangeDraft(draft, format));
                setOpen(false);
              }}
            >
              {PWA_LABELS.datePickerDone}
            </Button>
          </div>
        }
      >
        <div className="responsive-date-picker-panel-host responsive-date-picker-panel-host-range">
          <DatePicker.RangePicker
            {...props}
            value={panelValue}
            format={format}
            open
            inputReadOnly
            getPopupContainer={(node) => node.parentElement ?? document.body}
            className="responsive-date-picker-hidden-input"
            classNames={{
              popup: {
                root: 'responsive-date-picker-popup responsive-date-picker-popup-range',
              },
            }}
            onChange={(next) => {
              setDraft(next ?? null);
            }}
          />
        </div>
      </Drawer>
    </>
  );
}
