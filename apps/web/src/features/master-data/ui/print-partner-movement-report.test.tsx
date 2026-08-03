import { afterEach, describe, expect, it, vi } from "vitest";
import type { BusinessPartnerMovementReport } from "../api/business-partners.api";
import {
  openPartnerMovementPrintWindow,
  renderPartnerMovementPrintWindow,
} from "./print-partner-movement-report";

function report(): BusinessPartnerMovementReport {
  return {
    partnerId: "partner-1",
    partnerCode: "0000042",
    partnerName: "Şərq & Tekstil",
    generatedAt: "2026-08-04T12:00:00+04:00",
    totalCount: 1,
    rows: [
      {
        id: "SALE:sale-1",
        operationType: "SALE",
        operationTypeLabel: "Satış",
        date: "2026-08-02T00:00:00+04:00",
        documentNumber: "SAL-0000001",
        amount: "250.0000",
        status: "POSTED",
        statusLabel: "Tamamlanıb",
        createdByUserId: "user-1",
        createdByName: "Əli Məmmədov",
        description: "<script>yanlış</script>",
      },
    ],
  };
}

describe("partner movement report print view", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("opens an immediate standalone preparation window", () => {
    const write = vi.fn();
    const printWindow = {
      document: { open: vi.fn(), write, close: vi.fn() },
    };
    vi.spyOn(window, "open").mockReturnValue(printWindow as unknown as Window);

    expect(openPartnerMovementPrintWindow()).toBe(printWindow);
    expect(write).toHaveBeenCalledWith(
      expect.stringContaining("Məlumatlar hazırlanır…"),
    );
  });

  it("renders only an A4 report table, repeats headers, escapes data, and prints", () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const print = vi.fn();
    const printWindow = {
      document: { open: vi.fn(), write, close: vi.fn() },
      addEventListener: vi.fn(),
      close: vi.fn(),
      focus: vi.fn(),
      print,
    } as unknown as Window;

    renderPartnerMovementPrintWindow(printWindow, report());

    const html = write.mock.calls[0][0] as string;
    expect(html).toContain("@page { size: A4 landscape");
    expect(html).toContain("thead { display: table-header-group; }");
    expect(html).toContain("Şərq &amp; Tekstil");
    expect(html).toContain("&lt;script&gt;yanlış&lt;/script&gt;");
    expect(html).not.toContain("<button");
    expect(html).not.toContain("sidebar");
    vi.runAllTimers();
    expect(print).toHaveBeenCalledOnce();
  });
});
