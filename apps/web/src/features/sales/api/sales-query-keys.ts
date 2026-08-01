import type { SaleListQuery } from './sales.api';

function normalized(query: SaleListQuery) {
  return Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== '')
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

export const salesQueryKeys = {
  all: ['sales'] as const,
  lists: ['sales', 'list'] as const,
  list: (query: SaleListQuery = {}) =>
    ['sales', 'list', normalized(query)] as const,
  details: ['sales', 'detail'] as const,
  detail: (id: string) => ['sales', 'detail', id] as const,
};
