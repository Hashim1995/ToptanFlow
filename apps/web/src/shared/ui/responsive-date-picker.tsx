import { useMemo, useState } from 'react';
import { Button, DatePicker, Drawer, Grid, type DatePickerProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { DATE_DISPLAY_FORMAT } from '../datetime';
import { PWA_LABELS } from '../pwa/labels';
import './responsive-date-picker.css';

export type ResponsiveDatePickerProps = Omit<
  DatePickerProps,
  'value' | 'onChange' | 'format'
> & {
  value?: Dayjs | null;
  format?: string;
  onChange?: (date: Dayjs | null, dateString: string) => void;
};

function useIsMobileDatePicker(): boolean {
  const screens = Grid.useBreakpoint();
  return !screens.md;
}

function asSingleDate(value: Dayjs | Dayjs[] | null): Dayjs | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatDraft(value: Dayjs | null, format: string): string {
  if (!value) return '';
  return value.format(format);
}

/**
 * Desktop: standard Ant DatePicker popup.
 * Mobile: bottom drawer with an inline calendar panel (touch-friendly).
 */
export function ResponsiveDatePicker({
  format = DATE_DISPLAY_FORMAT,
  value = null,
  onChange,
  ...props
}: ResponsiveDatePickerProps) {
  const isMobile = useIsMobileDatePicker();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Dayjs | null>(null);

  const panelValue = useMemo(() => {
    if (open) return draft;
    return value;
  }, [draft, open, value]);

  if (!isMobile) {
    return (
      <DatePicker
        {...props}
        format={format}
        value={value}
        onChange={(next) => {
          const single = asSingleDate(next);
          onChange?.(single, formatDraft(single, format));
        }}
      />
    );
  }

  return (
    <>
      <DatePicker
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
        title={PWA_LABELS.datePickerTitle}
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
                onChange?.(draft, formatDraft(draft, format));
                setOpen(false);
              }}
            >
              {PWA_LABELS.datePickerDone}
            </Button>
          </div>
        }
      >
        <div className="responsive-date-picker-panel-host">
          <DatePicker
            {...props}
            value={panelValue}
            format={format}
            open
            inputReadOnly
            getPopupContainer={(node) => node.parentElement ?? document.body}
            className="responsive-date-picker-hidden-input"
            classNames={{ popup: { root: 'responsive-date-picker-popup' } }}
            onChange={(next) => {
              setDraft(asSingleDate(next));
            }}
          />
        </div>
      </Drawer>
    </>
  );
}
