import { afterEach, describe, expect, it, vi } from 'vitest';
import { printCommercialDocument } from './print-commercial-document';

describe('printCommercialDocument', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('prints only the selected document in a standalone page', () => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<main><article id="sale-print-document">Satış sənədi</article></main>';

    const write = vi.fn();
    const print = vi.fn();
    const printWindow = {
      document: {
        open: vi.fn(),
        write,
        close: vi.fn(),
      },
      addEventListener: vi.fn(),
      close: vi.fn(),
      focus: vi.fn(),
      print,
    };
    vi.spyOn(window, 'open').mockReturnValue(printWindow as unknown as Window);

    expect(printCommercialDocument('sale-print-document', 'Satış sənədi')).toBe(
      true,
    );
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining(
        '<body><article id="sale-print-document">Satış sənədi</article></body>',
      ),
    );

    vi.runAllTimers();
    expect(print).toHaveBeenCalledOnce();
  });

  it('returns false when the print window is blocked', () => {
    document.body.innerHTML = '<article id="purchase-print-document" />';
    vi.spyOn(window, 'open').mockReturnValue(null);

    expect(
      printCommercialDocument('purchase-print-document', 'Alış sənədi'),
    ).toBe(false);
  });
});
