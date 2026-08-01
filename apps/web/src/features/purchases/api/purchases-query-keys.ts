import type { PurchaseListQuery } from './purchases.api';

function normalized(query: PurchaseListQuery) {
  return Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== '')
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

export const purchasesQueryKeys = {
  all: ['purchases'] as const,
  lists: ['purchases', 'list'] as const,
  list: (query: PurchaseListQuery = {}) =>
    ['purchases', 'list', normalized(query)] as const,
  details: ['purchases', 'detail'] as const,
  detail: (id: string) => ['purchases', 'detail', id] as const,
};
