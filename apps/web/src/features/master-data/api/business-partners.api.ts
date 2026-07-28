import { httpClient } from '../../../api/http-client';
import { normalizeListQuery } from './normalize-list-query';
import type {
  BusinessPartnerDuplicateCandidate,
  MasterDataListQuery,
  PaginatedResponse,
} from './master-data.types';

export type BusinessPartnerCurrencySummary = {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  isActive: boolean;
};

export type BusinessPartner = {
  id: string;
  code: string;
  name: string;
  isCustomer: boolean;
  isSupplier: boolean;
  phone: string | null;
  email: string | null;
  taxNumber: string | null;
  address: string | null;
  notes: string | null;
  defaultCurrencyId: string;
  defaultCurrency: BusinessPartnerCurrencySummary;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BusinessPartnerListQuery = MasterDataListQuery;

export type CreateBusinessPartnerInput = {
  name: string;
  isCustomer: boolean;
  isSupplier: boolean;
  defaultCurrencyId: string;
  phone?: string | null;
  email?: string | null;
  taxNumber?: string | null;
  address?: string | null;
  notes?: string | null;
  acknowledgeDuplicate?: boolean;
};

export type UpdateBusinessPartnerInput = {
  name?: string;
  isCustomer?: boolean;
  isSupplier?: boolean;
  defaultCurrencyId?: string;
  phone?: string | null;
  email?: string | null;
  taxNumber?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive?: boolean;
  acknowledgeDuplicate?: boolean;
};

export type { BusinessPartnerDuplicateCandidate };

export async function listBusinessPartners(
  query: BusinessPartnerListQuery = {},
): Promise<PaginatedResponse<BusinessPartner>> {
  const { data } = await httpClient.get<PaginatedResponse<BusinessPartner>>(
    '/business-partners',
    { params: normalizeListQuery(query) },
  );
  return data;
}

export async function getBusinessPartner(
  id: string,
): Promise<BusinessPartner> {
  const { data } = await httpClient.get<BusinessPartner>(
    `/business-partners/${id}`,
  );
  return data;
}

export async function createBusinessPartner(
  input: CreateBusinessPartnerInput,
): Promise<BusinessPartner> {
  const { data } = await httpClient.post<BusinessPartner>(
    '/business-partners',
    input,
  );
  return data;
}

export async function updateBusinessPartner(
  id: string,
  input: UpdateBusinessPartnerInput,
): Promise<BusinessPartner> {
  const { data } = await httpClient.patch<BusinessPartner>(
    `/business-partners/${id}`,
    input,
  );
  return data;
}

export async function deactivateBusinessPartner(
  id: string,
): Promise<BusinessPartner> {
  const { data } = await httpClient.delete<BusinessPartner>(
    `/business-partners/${id}`,
  );
  return data;
}
