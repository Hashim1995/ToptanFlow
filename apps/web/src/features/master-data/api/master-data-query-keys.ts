import { normalizeListQuery } from './normalize-list-query';
import type {
  MasterDataEntityName,
  MasterDataListQuery,
} from './master-data.types';

function createEntityKeys(entity: MasterDataEntityName) {
  const root = ['master-data', entity] as const;

  return {
    all: root,
    lists: [...root, 'list'] as const,
    list: (query: MasterDataListQuery = {}) =>
      [...root, 'list', normalizeListQuery(query)] as const,
    details: [...root, 'detail'] as const,
    detail: (id: string) => [...root, 'detail', id] as const,
  };
}

/**
 * Shared deterministic TanStack Query keys (ADR-016).
 * Feature hooks own fetching/mutations; Redux never mirrors these entities.
 */
export const masterDataQueryKeys = {
  currencies: createEntityKeys('currencies'),
  units: createEntityKeys('units'),
  products: createEntityKeys('products'),
  productCategories: createEntityKeys('product-categories'),
  businessPartners: createEntityKeys('business-partners'),
};
