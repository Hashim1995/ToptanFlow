import { formatDateTime } from '../../../shared/datetime';
import { formatMoney } from '../../../shared/money/format-money';
import type { DailyBalanceReport } from '../api/daily-balance-report.api';

const PRINT_STYLES = `
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; color: #182230; background: #fff; }
  body { font-family: Arial, sans-serif; font-size: 9pt; line-height: 1.35; }
  main { width: 100%; }
  header { margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #1677ff; }
  h1 { margin: 0 0 5px; color: #101828; font-size: 18pt; }
  header p { margin: 0; color: #667085; }
  section { margin-top: 16px; }
  section h2 { margin: 0 0 8px; color: #101828; font-size: 12pt; }
  .summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 12px 0 4px;
  }
  .summary > div {
    padding: 8px 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
  }
  .summary span { display: block; color: #667085; font-size: 7.5pt; font-weight: 600; }
  .summary strong { display: block; margin-top: 3px; font-size: 10pt; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th { padding: 7px 6px; color: #fff; font-size: 7.5pt; text-align: left; background: #1457a6; }
  td { padding: 7px 6px; vertical-align: top; overflow-wrap: anywhere; border-bottom: 1px solid #dfe5ec; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .amount { text-align: right; white-space: nowrap; }
  .empty { padding: 22px; color: #667085; text-align: center; }
  .total-row td { font-weight: 700; background: #eef4fb !important; border-top: 2px solid #1457a6; }
`;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] ?? character,
  );
}

function partnerRole(partner: DailyBalanceReport['partners'][number]): string {
  const roles: string[] = [];
  if (partner.isCustomer) roles.push('Müştəri');
  if (partner.isSupplier) roles.push('Təchizatçı');
  return roles.join(', ') || '—';
}

function partnerReceivable(balance: string): string {
  const value = Number(balance);
  return value > 0 ? formatMoney(balance) : formatMoney('0');
}

function partnerPayable(balance: string): string {
  const value = Number(balance);
  return value < 0 ? formatMoney(Math.abs(value).toFixed(4)) : formatMoney('0');
}

export function openDailyBalancePrintWindow(): Window | null {
  const printWindow = window.open('', '_blank', 'width=1180,height=820');
  if (!printWindow) return null;
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="az"><head>
    <meta charset="UTF-8" /><title>Günlük report hazırlanır</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;color:#344054}</style>
    </head><body>Məlumatlar hazırlanır…</body></html>`);
  printWindow.document.close();
  return printWindow;
}

export function renderDailyBalancePrintWindow(
  printWindow: Window,
  report: DailyBalanceReport,
): void {
  const partnerRows = report.partners.length
    ? report.partners
        .map(
          (partner) => `<tr>
            <td>${escapeHtml(partner.code)}</td>
            <td>${escapeHtml(partner.name)}</td>
            <td>${escapeHtml(partnerRole(partner))}</td>
            <td>${partner.isActive ? 'Aktiv' : 'Deaktiv'}</td>
            <td class="amount">${escapeHtml(partnerReceivable(partner.currentDebtBalance))}</td>
            <td class="amount">${escapeHtml(partnerPayable(partner.currentDebtBalance))}</td>
            <td>${escapeHtml(partner.debtBalanceLabel)}</td>
          </tr>`,
        )
        .join('')
    : '<tr><td class="empty" colspan="7">Tərəfdaş tapılmadı.</td></tr>';

  const cashRows = report.cashAccounts.length
    ? report.cashAccounts
        .map(
          (account) => `<tr>
            <td>${escapeHtml(account.code)}</td>
            <td>${escapeHtml(account.name)}</td>
            <td>${escapeHtml(account.responsibleUserName)}</td>
            <td class="amount">${escapeHtml(formatMoney(account.currentBalance))}</td>
          </tr>`,
        )
        .join('')
    : '<tr><td class="empty" colspan="4">Aktiv kassa hesabı tapılmadı.</td></tr>';

  const title = 'Günlük report';
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
            <h1>${escapeHtml(title)}</h1>
            <p>Hazırlanma vaxtı: ${escapeHtml(formatDateTime(report.generatedAt))}</p>
          </header>
          <div class="summary">
            <div>
              <span>Tərəfdaş sayı</span>
              <strong>${report.partnerCount}</strong>
            </div>
            <div>
              <span>Alacağımız</span>
              <strong>${escapeHtml(formatMoney(report.totalPartnerReceivable))} AZN</strong>
            </div>
            <div>
              <span>Verəcəyimiz</span>
              <strong>${escapeHtml(formatMoney(report.totalPartnerPayable))} AZN</strong>
            </div>
            <div>
              <span>Xalis borc balansı</span>
              <strong>${escapeHtml(formatMoney(report.totalPartnerDebtBalance))} AZN</strong>
            </div>
            <div>
              <span>Aktiv kassa hesabı</span>
              <strong>${report.activeCashAccountCount}</strong>
            </div>
            <div>
              <span>Ümumi kassa cəmi</span>
              <strong>${escapeHtml(formatMoney(report.totalCompanyCash))} AZN</strong>
            </div>
          </div>
          <section>
            <h2>Tərəfdaşlar</h2>
            <table>
              <thead><tr>
                <th>Kod</th>
                <th>Ad</th>
                <th>Rol</th>
                <th>Status</th>
                <th class="amount">Alacağımız (AZN)</th>
                <th class="amount">Verəcəyimiz (AZN)</th>
                <th>Borc vəziyyəti</th>
              </tr></thead>
              <tbody>
                ${partnerRows}
                <tr class="total-row">
                  <td colspan="4">Ümumi cəm</td>
                  <td class="amount">${escapeHtml(formatMoney(report.totalPartnerReceivable))}</td>
                  <td class="amount">${escapeHtml(formatMoney(report.totalPartnerPayable))}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </section>
          <section>
            <h2>Kassa hesabları</h2>
            <table>
              <thead><tr>
                <th>Kod</th>
                <th>Ad</th>
                <th>Məsul şəxs</th>
                <th class="amount">Balans (AZN)</th>
              </tr></thead>
              <tbody>
                ${cashRows}
                <tr class="total-row">
                  <td colspan="3">Ümumi kassa cəmi</td>
                  <td class="amount">${escapeHtml(formatMoney(report.totalCompanyCash))}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </main>
      </body>
    </html>`);
  printWindow.document.close();
  printWindow.addEventListener('afterprint', () => printWindow.close(), {
    once: true,
  });
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 100);
}
