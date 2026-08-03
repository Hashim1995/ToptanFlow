import { formatMoney } from '../money/format-money';
import { formatDateTime, formatQuantity } from './format';

type PrintableCommercialLine = {
  id: string;
  productCode: string;
  productName: string;
  unitName: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
};

type PrintableCommercialDocumentProps = {
  id: string;
  title: string;
  documentNumber: string;
  status: string;
  businessDate: string;
  partnerLabel: string;
  partnerCode: string;
  partnerName: string;
  supplierInvoiceNumber?: string | null;
  notes?: string | null;
  subtotalAmount: string;
  totalAmount: string;
  lines: PrintableCommercialLine[];
};

export function PrintableCommercialDocument({
  id,
  title,
  documentNumber,
  status,
  businessDate,
  partnerLabel,
  partnerCode,
  partnerName,
  supplierInvoiceNumber,
  notes,
  subtotalAmount,
  totalAmount,
  lines,
}: PrintableCommercialDocumentProps) {
  return (
    <article id={id} className="commercial-print-document" aria-hidden="true">
      <header className="commercial-print-header">
        <div>
          <strong className="commercial-print-brand">TOPTANFLOW</strong>
          <h1>{title}</h1>
        </div>
        <div className="commercial-print-document-id">
          <strong>{documentNumber}</strong>
          <span>{status}</span>
        </div>
      </header>

      <div className="commercial-print-meta">
        <div>
          <span>Əməliyyat tarixi</span>
          <strong>{formatDateTime(businessDate)}</strong>
        </div>
        <div>
          <span>{partnerLabel}</span>
          <strong>
            {partnerCode} — {partnerName}
          </strong>
        </div>
        {supplierInvoiceNumber ? (
          <div>
            <span>Təchizatçı faktura nömrəsi</span>
            <strong>{supplierInvoiceNumber}</strong>
          </div>
        ) : null}
      </div>

      <table className="commercial-print-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Məhsul</th>
            <th>Ölçü vahidi</th>
            <th className="commercial-print-number">Miqdar</th>
            <th className="commercial-print-number">Vahid qiyməti</th>
            <th className="commercial-print-number">Yekun</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={line.id}>
              <td>{index + 1}</td>
              <td>
                <strong>{line.productName}</strong>
                <small>{line.productCode}</small>
              </td>
              <td>{line.unitName}</td>
              <td className="commercial-print-number">
                {formatQuantity(line.quantity)}
              </td>
              <td className="commercial-print-number">
                {formatMoney(line.unitPrice)}
              </td>
              <td className="commercial-print-number">
                <strong>{formatMoney(line.lineTotal)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="commercial-print-summary">
        <div>
          <span>Ara cəm</span>
          <strong>{formatMoney(subtotalAmount)}</strong>
        </div>
        <div className="commercial-print-grand-total">
          <span>Yekun məbləğ</span>
          <strong>{formatMoney(totalAmount)}</strong>
        </div>
      </div>

      {notes ? (
        <div className="commercial-print-notes">
          <span>Qeyd</span>
          <p>{notes}</p>
        </div>
      ) : null}
    </article>
  );
}
