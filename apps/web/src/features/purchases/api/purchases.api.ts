import { httpClient } from '../../../api/http-client';
import type { PaginatedResponse } from '../../master-data/api/master-data.types';

export type PurchaseStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';
export type PurchaseSortBy =
  | 'documentNumber'
  | 'businessDate'
  | 'status'
  | 'totalAmount'
  | 'createdAt';

export type PurchaseListQuery = {
  page?: number;
  pageSize?: number;
  documentNumber?: string;
  partnerId?: string;
  status?: PurchaseStatus;
  businessDateFrom?: string;
  businessDateTo?: string;
  productId?: string;
  createdByUserId?: string;
  minTotal?: string;
  maxTotal?: string;
  sortBy?: PurchaseSortBy;
  sortOrder?: 'asc' | 'desc';
};

export type PurchaseListItem = {
  id: string;
  documentNumber: string;
  businessDate: string;
  status: PurchaseStatus;
  partnerId?: string;
  partnerName?: string;
  partnerCode?: string;
  partner?: PurchasePartner;
  supplierInvoiceNumber?: string | null;
  itemCount: number;
  subtotalAmount: string;
  discountAmount: string | null;
  totalAmount: string;
  createdByUserId?: string;
  createdByName?: string;
  createdBy?: PurchaseUser;
  createdAt: string;
  updatedAt: string;
  hasLinkedCashOperation?: boolean;
};

export type PurchaseUser = {
  id: string;
  username: string;
  fullName: string;
};

export type PurchasePartner = {
  id: string;
  code: string;
  name: string;
  currentDebtBalance: string;
  isSupplier: boolean;
  isActive: boolean;
};

export type PurchaseItem = {
  id: string;
  productId: string;
  unitId: string;
  productCodeSnapshot: string;
  productNameSnapshot: string;
  unitNameSnapshot: string;
  quantity: string;
  invoicedQuantity: string | null;
  unitPrice: string;
  discountAmount: string;
  lineSubtotal: string;
  lineTotal: string;
  notes: string | null;
};

export type PurchaseQuantityHistory = {
  id: string;
  productId: string;
  kind: string;
  quantityChange: string;
  quantityBefore: string;
  quantityAfter: string;
  reason: string | null;
  createdAt: string;
  createdByUserId?: string;
};

export type PurchaseDebtMovement = {
  id: string;
  kind: string;
  signedAmount: string;
  balanceBefore: string;
  balanceAfter: string;
  reason: string | null;
  reversalOfId: string | null;
  createdAt: string;
  createdByUserId?: string;
};

export type PurchaseLinkedCashTransaction = {
  id: string;
  transactionNumber: string;
  cashAccountId: string;
  cashAccountName: string;
  cashAccountCode: string;
  direction: string;
  type: string;
  status: string;
  amount: string;
  transactionDate: string;
};

export type Purchase = {
  id: string;
  documentNumber: string;
  partnerId?: string;
  partner: PurchasePartner;
  businessDate: string;
  status: PurchaseStatus;
  supplierInvoiceNumber: string | null;
  subtotalAmount: string;
  discountAmount: string | null;
  totalAmount: string;
  notes: string | null;
  postedAt: string | null;
  postedByUserId?: string | null;
  postedBy: PurchaseUser | null;
  cancelledAt: string | null;
  cancelledByUserId?: string | null;
  cancelledBy: PurchaseUser | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
  createdBy: PurchaseUser;
  items: PurchaseItem[];
  productQuantityHistory: PurchaseQuantityHistory[];
  partnerDebtMovements: PurchaseDebtMovement[];
  cashTransactions: PurchaseLinkedCashTransaction[];
};

export type PurchaseItemInput = {
  productId: string;
  quantity: string;
  unitPrice: string;
  discountAmount?: string;
  notes?: string;
};

export type PurchaseInput = {
  partnerId: string;
  businessDate: string;
  notes?: string;
  supplierInvoiceNumber?: string;
  discountAmount?: string;
  items: PurchaseItemInput[];
};

export type ImmediatePaymentInput = {
  cashAccountId: string;
  amount: string;
  notes?: string;
  negativeBalanceOverrideReason?: string;
};

export type PostPurchaseInput = {
  immediatePayment?: ImmediatePaymentInput;
};

function cleanQuery(query: PurchaseListQuery) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  );
}

export async function listPurchases(
  query: PurchaseListQuery = {},
): Promise<PaginatedResponse<PurchaseListItem>> {
  const { data } = await httpClient.get<PaginatedResponse<PurchaseListItem>>(
    '/purchases',
    { params: cleanQuery(query) },
  );
  return data;
}

export async function getPurchase(id: string): Promise<Purchase> {
  const { data } = await httpClient.get<Purchase>(`/purchases/${id}`);
  return data;
}

export async function createPurchase(input: PurchaseInput): Promise<Purchase> {
  const { data } = await httpClient.post<Purchase>('/purchases', input);
  return data;
}

export async function updatePurchase(
  id: string,
  input: PurchaseInput,
): Promise<Purchase> {
  const { data } = await httpClient.patch<Purchase>(`/purchases/${id}`, input);
  return data;
}

export async function removePurchase(id: string): Promise<void> {
  await httpClient.delete(`/purchases/${id}`);
}

export async function postPurchase(
  id: string,
  input: PostPurchaseInput = {},
): Promise<Purchase> {
  const body: PostPurchaseInput = {};
  if (input.immediatePayment) {
    body.immediatePayment = input.immediatePayment;
  }
  const { data } = await httpClient.post<Purchase>(
    `/purchases/${id}/post`,
    Object.keys(body).length > 0 ? body : undefined,
  );
  return data;
}

export async function cancelPurchase(
  id: string,
  reason: string,
): Promise<Purchase> {
  const { data } = await httpClient.post<Purchase>(`/purchases/${id}/cancel`, {
    reason,
  });
  return data;
}
