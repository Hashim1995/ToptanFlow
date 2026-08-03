import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BusinessPartner } from "../api/business-partners.api";
import { BusinessPartnerMovementReportModal } from "./business-partner-movement-report-modal";

const apiMocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  download: vi.fn(),
  getReport: vi.fn(),
}));

vi.mock("../api/business-partners.api", async () => {
  const actual = await vi.importActual("../api/business-partners.api");
  return {
    ...actual,
    listBusinessPartnerMovementReportUsers: apiMocks.listUsers,
    downloadBusinessPartnerMovementReport: apiMocks.download,
    getBusinessPartnerMovementReport: apiMocks.getReport,
  };
});

const partner: BusinessPartner = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  code: "0000042",
  name: "Şərq Tekstil",
  isCustomer: true,
  isSupplier: true,
  phone: null,
  email: null,
  taxNumber: null,
  address: null,
  notes: null,
  currentDebtBalance: "0",
  isActive: true,
  createdAt: "2026-08-01T00:00:00+04:00",
  updatedAt: "2026-08-01T00:00:00+04:00",
};

function renderModal(onClose = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <BusinessPartnerMovementReportModal
        partner={partner}
        open
        onClose={onClose}
      />
    </QueryClientProvider>,
  );
  return onClose;
}

describe("BusinessPartnerMovementReportModal", () => {
  let restoreGetComputedStyle = () => undefined;

  beforeEach(() => {
    const getComputedStyle = window.getComputedStyle.bind(window);
    const spy = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((element) => getComputedStyle(element));
    restoreGetComputedStyle = () => spy.mockRestore();
  });

  afterEach(() => {
    cleanup();
    restoreGetComputedStyle();
    vi.clearAllMocks();
  });

  it("shows the required Azerbaijani filters and leaves output format explicit", async () => {
    apiMocks.listUsers.mockResolvedValue([]);
    renderModal();

    expect(screen.getByText("Şərq Tekstil (0000042)")).toBeInTheDocument();
    expect(screen.getByText("Tarix aralığı")).toBeInTheDocument();
    expect(screen.getByText("Əməliyyat növü")).toBeInTheDocument();
    expect(screen.getByText("Əməliyyatı edən istifadəçi")).toBeInTheDocument();
    expect(screen.getByText("Çıxış formatı")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Excel" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Print" })).not.toBeChecked();
    expect(screen.queryByRole("radio", { name: "PDF" })).not.toBeInTheDocument();
    expect(await screen.findByText("Bütün istifadəçilər")).toBeInTheDocument();
  });

  it("warns and aborts before closing an active report process", async () => {
    apiMocks.listUsers.mockResolvedValue([]);
    let observedSignal: AbortSignal | undefined;
    apiMocks.download.mockImplementation(
      (_partnerId, _query, _format, signal: AbortSignal) => {
        observedSignal = signal;
        return new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        });
      },
    );
    const onClose = renderModal();

    fireEvent.click(screen.getByRole("radio", { name: "Excel" }));
    fireEvent.click(screen.getByRole("button", { name: "Reportu hazırla" }));
    await screen.findByText("Məlumatlar hazırlanır");
    await waitFor(() => expect(apiMocks.download).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Bağla" }));
    expect(
      await screen.findByText(
        "Report hazırlanır və ya yükləmə tamamlanmayıb. Modalı bağlasanız əməliyyat yarımçıq qala bilər.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Prosesi dayandır" }));

    await waitFor(() => expect(observedSignal?.aborted).toBe(true));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
