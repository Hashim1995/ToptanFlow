import type { MasterDataListQuery } from './master-data.types';

export type NormalizedListQuery = Readonly<
  Record<string, string | number | boolean>
>;

/**
 * Produces stable Axios query params and query-key input.
 * Empty strings and undefined values are omitted; false and zero are kept.
 */
export function normalizeListQuery(
  query: MasterDataListQuery = {},
): NormalizedListQuery {
  const normalized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        normalized[key] = trimmed;
      }
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}
