const PRINT_DOCUMENT_STYLES = `
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #182230; }
  body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.35; }
  .commercial-print-document { display: block; width: 100%; }
  .commercial-print-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding: 0 0 14px; border-bottom: 2px solid #1677ff; }
  .commercial-print-brand { display: block; margin-bottom: 4px; color: #1677ff; font-size: 9pt; font-weight: 800; letter-spacing: .14em; }
  .commercial-print-header h1 { margin: 0; color: #101828; font-size: 21pt; line-height: 1.15; }
  .commercial-print-document-id { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; text-align: right; }
  .commercial-print-document-id strong { font-family: Consolas, monospace; font-size: 13pt; }
  .commercial-print-document-id span { padding: 3px 8px; color: #1457a6; font-size: 8.5pt; font-weight: 700; background: #eaf3ff; border-radius: 999px; }
  .commercial-print-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 28px; margin: 14px 0; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
  .commercial-print-meta > div { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
  .commercial-print-meta span, .commercial-print-summary span, .commercial-print-notes > span { color: #667085; font-size: 8.5pt; font-weight: 600; }
  .commercial-print-meta strong { overflow-wrap: anywhere; }
  .commercial-print-table { width: 100%; border-collapse: collapse; table-layout: auto; }
  .commercial-print-table th { padding: 8px 7px; color: #344054; font-size: 8pt; font-weight: 700; text-align: left; background: #eef4fb; border-bottom: 1px solid #cbd5e1; }
  .commercial-print-table td { padding: 8px 7px; vertical-align: top; border-bottom: 1px solid #e5e7eb; }
  .commercial-print-table tbody tr:nth-child(even) { background: #fbfcfe; }
  .commercial-print-table tr { break-inside: avoid; page-break-inside: avoid; }
  .commercial-print-table td small { display: block; margin-top: 2px; color: #98a2b3; font-family: Consolas, monospace; font-size: 7.5pt; }
  .commercial-print-number { white-space: nowrap; text-align: right !important; }
  .commercial-print-summary { width: 290px; margin: 14px 0 0 auto; break-inside: avoid; }
  .commercial-print-summary > div { display: flex; justify-content: space-between; gap: 18px; padding: 4px 0; }
  .commercial-print-grand-total { margin-top: 4px; padding: 8px 0 0 !important; color: #101828; font-size: 12pt; border-top: 2px solid #1677ff; }
  .commercial-print-notes { margin-top: 16px; padding: 10px 12px; background: #f8fafc; border-left: 3px solid #1677ff; break-inside: avoid; }
  .commercial-print-notes p { margin: 4px 0 0; white-space: pre-wrap; }
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

export function printCommercialDocument(
  elementId: string,
  documentTitle: string,
): boolean {
  const source = document.getElementById(elementId);
  if (!source) return false;

  const printWindow = window.open('', '_blank', 'width=980,height=760');
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="az">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(documentTitle)}</title>
        <style>${PRINT_DOCUMENT_STYLES}</style>
      </head>
      <body>${source.outerHTML}</body>
    </html>`);
  printWindow.document.close();

  printWindow.addEventListener('afterprint', () => printWindow.close(), {
    once: true,
  });
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 100);
  return true;
}
