export type SortOrder = 'asc' | 'desc';

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

/**
 * Common list fields supported by delivered master-data APIs.
 * Feature modules extend this shape with their approved filters/sort fields.
 */
export type MasterDataListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: SortOrder;
  /** Optional entity-specific filters. */
  type?: string;
  kind?: string;
  unitId?: string;
  categoryId?: string;
  isCustomer?: boolean;
  isSupplier?: boolean;
  defaultCurrencyId?: string;
};

export type MasterDataEntityName =
  | 'currencies'
  | 'units'
  | 'products'
  | 'product-categories'
  | 'business-partners'
  | 'warehouses';

export type BusinessPartnerDuplicateMatchedField =
  | 'name'
  | 'phone'
  | 'taxNumber';

export type BusinessPartnerDuplicateCandidate = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  taxNumber: string | null;
  isCustomer: boolean;
  isSupplier: boolean;
  isActive: boolean;
  matchedFields: BusinessPartnerDuplicateMatchedField[];
};
