import { formatDate } from "../../../shared/datetime";
import { formatMoney } from "../../../shared/money/format-money";
import type { BusinessPartnerMovementReport } from "../api/business-partners.api";

const PRINT_STYLES = `
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; color: #182230; background: #fff; }
  body { font-family: Arial, sans-serif; font-size: 9pt; line-height: 1.35; }
  main { width: 100%; }
  header { margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #1677ff; }
  h1 { margin: 0 0 5px; color: #101828; font-size: 18pt; }
  header p { margin: 0; font-weight: 700; }
  header small { display: block; margin-top: 4px; color: #667085; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th { padding: 7px 6px; color: #fff; font-size: 7.5pt; text-align: left; background: #1457a6; }
  td { padding: 7px 6px; vertical-align: top; overflow-wrap: anywhere; border-bottom: 1px solid #dfe5ec; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .type { width: 10%; }
  .date { width: 9%; }
  .number { width: 15%; }
  .amount { width: 12%; text-align: right; }
  .status { width: 11%; }
  .user { width: 16%; }
  .description { width: 27%; }
  .empty { padding: 28px; color: #667085; text-align: center; }
`;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

export function openPartnerMovementPrintWindow(): Window | null {
  const printWindow = window.open("", "_blank", "width=1180,height=820");
  if (!printWindow) return null;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="az"><head>
    <meta charset="UTF-8" /><title>Hərəkət reportu hazırlanır</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;color:#344054}</style>
    </head><body>Məlumatlar hazırlanır…</body></html>`);
  printWindow.document.close();
  return printWindow;
}

export function renderPartnerMovementPrintWindow(
  printWindow: Window,
  report: BusinessPartnerMovementReport,
): void {
  const rows = report.rows.length
    ? report.rows
        .map(
          (row) => `<tr>
            <td>${escapeHtml(row.operationTypeLabel)}</td>
            <td>${escapeHtml(formatDate(row.date))}</td>
            <td>${escapeHtml(row.documentNumber)}</td>
            <td class="amount">${escapeHtml(formatMoney(row.amount))}</td>
            <td>${escapeHtml(row.statusLabel)}</td>
            <td>${escapeHtml(row.createdByName)}</td>
            <td>${escapeHtml(row.description ?? "—")}</td>
          </tr>`,
        )
        .join("")
    : '<tr><td class="empty" colspan="7">Seçilmiş filtrlərə uyğun hərəkət tapılmadı.</td></tr>';

  const title = `Tərəfdaş hərəkət reportu — ${report.partnerCode}`;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="az">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        <main>
          <header>
            <h1>Tərəfdaş hərəkət reportu</h1>
            <p>${escapeHtml(report.partnerName)} (${escapeHtml(report.partnerCode)})</p>
            <small>Sətir sayı: ${report.totalCount}</small>
          </header>
          <table>
            <thead><tr>
              <th class="type">Əməliyyat növü</th>
              <th class="date">Tarix</th>
              <th class="number">Sənəd / əməliyyat №</th>
              <th class="amount">Məbləğ (AZN)</th>
              <th class="status">Status</th>
              <th class="user">Əməliyyatı edən istifadəçi</th>
              <th class="description">Qısa açıqlama</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </main>
      </body>
    </html>`);
  printWindow.document.close();
  printWindow.addEventListener("afterprint", () => printWindow.close(), {
    once: true,
  });
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 100);
}
