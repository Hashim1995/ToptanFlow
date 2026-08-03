import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrintableCommercialDocument } from './printable-commercial-document';

describe('PrintableCommercialDocument', () => {
  it('renders an Azerbaijani commercial document without presenting it as a payment receipt', () => {
    render(
      <PrintableCommercialDocument
        id="test-print-document"
        title="Satış sənədi"
        documentNumber="SAL-0000001"
        status="Təsdiqlənib"
        businessDate="2026-08-02T10:00:00.000Z"
        partnerLabel="Müştəri"
        partnerCode="0000001"
        partnerName="Nümunə tərəfdaş"
        subtotalAmount="12.00"
        totalAmount="10.00"
        lines={[
          {
            id: 'line-1',
            productCode: '0000001',
            productName: 'Nümunə məhsul',
            unitName: 'Ədəd',
            quantity: '2',
            unitPrice: '6.00',
            lineTotal: '10.00',
          },
        ]}
      />,
    );

    expect(screen.getByText('Satış sənədi')).toBeInTheDocument();
    expect(screen.getByText('SAL-0000001')).toBeInTheDocument();
    expect(screen.getByText('Nümunə məhsul')).toBeInTheDocument();
    expect(screen.queryByText('Endirim')).not.toBeInTheDocument();
    expect(screen.queryByText(/ödəniş qəbzi deyil/)).not.toBeInTheDocument();
  });
});
