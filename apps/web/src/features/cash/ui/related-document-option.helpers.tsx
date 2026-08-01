import { Tag, Tooltip, Typography } from 'antd';
import type { DefaultOptionType } from 'antd/es/select';
import { formatDateTime } from '../../../shared/datetime';
import { formatMoney } from '../../../shared/money/format-money';
import { CASH_LABELS } from './labels';

const { Text } = Typography;

/** Form / Select sentinel for explicit “No connection”. */
export const RELATED_DOC_NONE = '__none__';

export type RelatedDocumentOptionData = {
  id: string;
  documentNumber: string;
  partnerName: string;
  partnerCode: string;
  totalAmount: string;
  transactionDate: string;
  hasLinkedCashOperation: boolean;
};

export function relatedDocumentSelectValue(
  id: string | undefined,
): string {
  return id ? id : RELATED_DOC_NONE;
}

export function relatedDocumentFormValue(
  value: string | null | undefined,
): string {
  if (!value || value === RELATED_DOC_NONE) return '';
  return value;
}

export function formatRelatedDocumentDateTime(
  value: string | Date | null | undefined,
): string {
  return formatDateTime(value);
}

export function relatedDocumentClosedLabel(
  doc: RelatedDocumentOptionData | null | undefined,
): string {
  if (!doc) return CASH_LABELS.fields.noConnection;
  return `${doc.documentNumber} · ${doc.partnerName} · ${formatMoney(doc.totalAmount)}`;
}

export function buildRelatedDocumentOptions(
  documents: RelatedDocumentOptionData[],
): DefaultOptionType[] {
  return [
    {
      value: RELATED_DOC_NONE,
      label: CASH_LABELS.fields.noConnection,
      title: CASH_LABELS.fields.noConnection,
      searchText: CASH_LABELS.fields.noConnection.toLowerCase(),
    },
    ...documents.map((doc) => ({
      value: doc.id,
      label: relatedDocumentClosedLabel(doc),
      title: relatedDocumentClosedLabel(doc),
      searchText: [
        doc.documentNumber,
        doc.partnerName,
        doc.partnerCode,
        doc.totalAmount,
        CASH_LABELS.fields.noConnection,
      ]
        .join(' ')
        .toLowerCase(),
      document: doc,
    })),
  ];
}

function renderRelatedDocumentOptionBody({
  doc,
}: {
  doc: RelatedDocumentOptionData;
}) {
  const partnerLine = `${doc.partnerName} · ${doc.partnerCode}`;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '4px 0',
        minWidth: 0,
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 8,
          alignItems: 'baseline',
        }}
      >
        <Text strong style={{ fontSize: 14 }}>
          {doc.documentNumber}
        </Text>
        <Text strong style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
          {formatMoney(doc.totalAmount)}
        </Text>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 8,
          alignItems: 'baseline',
        }}
      >
        <Tooltip title={partnerLine}>
          <Text
            type="secondary"
            ellipsis
            style={{ maxWidth: '100%', flex: '1 1 140px', minWidth: 0 }}
          >
            {partnerLine}
          </Text>
        </Tooltip>
        <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
          {formatRelatedDocumentDateTime(doc.transactionDate)}
        </Text>
      </div>
      <div>
        {doc.hasLinkedCashOperation ? (
          <Tag color="processing" style={{ marginInlineEnd: 0 }}>
            {CASH_LABELS.fields.invoiceLinkedToCash}
          </Tag>
        ) : (
          <Tag style={{ marginInlineEnd: 0 }}>
            {CASH_LABELS.fields.invoiceNotLinkedToCash}
          </Tag>
        )}
      </div>
    </div>
  );
}

export function relatedDocumentOptionRender(oriOption: {
  data?: DefaultOptionType & {
    document?: RelatedDocumentOptionData;
    value?: string | number | null;
  };
  value?: string | number | null;
}) {
  const raw = oriOption.data ?? oriOption;
  const value = raw.value;
  if (value === RELATED_DOC_NONE || !('document' in raw) || !raw.document) {
    return (
      <Text style={{ padding: '4px 0', display: 'block' }}>
        {CASH_LABELS.fields.noConnection}
      </Text>
    );
  }
  return renderRelatedDocumentOptionBody({ doc: raw.document });
}
