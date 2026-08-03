import { httpClient } from '../../../api/http-client';
import type { AxiosProgressEvent } from 'axios';
import type { Dayjs } from 'dayjs';
import { normalizeListQuery } from './normalize-list-query';
import type {
  BusinessPartnerDuplicateCandidate,
  MasterDataListQuery,
  PaginatedResponse,
} from './master-data.types';

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
  currentDebtBalance: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BusinessPartnerListQuery = MasterDataListQuery;

export type PartnerMovementOperationType =
  'PURCHASE' | 'SALE' | 'CASH_IN' | 'CASH_OUT';
export type PartnerMovementStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';
export type PartnerMovementOutputFormat = 'EXCEL' | 'PRINT';

export type BusinessPartnerMovementReportQuery = {
  dateRange?: [Dayjs | null, Dayjs | null] | null;
  operationTypes: PartnerMovementOperationType[];
  statuses: PartnerMovementStatus[];
  createdByUserIds: string[];
};

export type BusinessPartnerMovementReportUser = {
  id: string;
  fullName: string;
  isActive: boolean;
};

export type BusinessPartnerMovementReportRow = {
  id: string;
  operationType: PartnerMovementOperationType;
  operationTypeLabel: string;
  date: string;
  documentNumber: string;
  amount: string;
  status: PartnerMovementStatus;
  statusLabel: string;
  createdByUserId: string;
  createdByName: string;
  description: string | null;
};

export type BusinessPartnerMovementReport = {
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  generatedAt: string;
  totalCount: number;
  rows: BusinessPartnerMovementReportRow[];
};

export type CreateBusinessPartnerInput = {
  name: string;
  isCustomer: boolean;
  isSupplier: boolean;
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

function movementReportParams(query: BusinessPartnerMovementReportQuery) {
  return {
    dateFrom: query.dateRange?.[0]?.format('YYYY-MM-DD'),
    dateTo: query.dateRange?.[1]?.format('YYYY-MM-DD'),
    operationTypes: query.operationTypes.join(','),
    statuses: query.statuses.join(','),
    createdByUserIds: query.createdByUserIds.join(','),
  };
}

export async function listBusinessPartnerMovementReportUsers(
  partnerId: string,
  signal?: AbortSignal,
): Promise<BusinessPartnerMovementReportUser[]> {
  const { data } = await httpClient.get<BusinessPartnerMovementReportUser[]>(
    `/business-partners/${partnerId}/movement-report/users`,
    { signal },
  );
  return data;
}

export async function getBusinessPartnerMovementReport(
  partnerId: string,
  query: BusinessPartnerMovementReportQuery,
  signal: AbortSignal,
): Promise<BusinessPartnerMovementReport> {
  const { data } = await httpClient.get<BusinessPartnerMovementReport>(
    `/business-partners/${partnerId}/movement-report`,
    { params: movementReportParams(query), signal },
  );
  return data;
}

export async function downloadBusinessPartnerMovementReport(
  partnerId: string,
  query: BusinessPartnerMovementReportQuery,
  format: Exclude<PartnerMovementOutputFormat, 'PRINT'>,
  signal: AbortSignal,
  onDownloadProgress?: (event: AxiosProgressEvent) => void,
): Promise<Blob> {
  const { data } = await httpClient.get<Blob>(
    `/business-partners/${partnerId}/movement-report/export`,
    {
      params: { ...movementReportParams(query), format },
      responseType: 'blob',
      signal,
      onDownloadProgress,
    },
  );
  return data;
}
