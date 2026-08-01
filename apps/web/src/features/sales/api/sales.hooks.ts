import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterDataQueryKeys } from '../../master-data/api/master-data-query-keys';
import {
  cancelSale,
  createSale,
  getSale,
  listSales,
  postSale,
  removeSale,
  updateSale,
  type PostSaleInput,
  type SaleInput,
  type SaleListQuery,
} from './sales.api';
import { salesQueryKeys } from './sales-query-keys';

export function useSalesList(query: SaleListQuery) {
  return useQuery({
    queryKey: salesQueryKeys.list(query),
    queryFn: () => listSales(query),
  });
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey: salesQueryKeys.detail(id ?? ''),
    queryFn: () => getSale(id!),
    enabled: Boolean(id),
  });
}

function useSaleInvalidation() {
  const queryClient = useQueryClient();
  return async (affectsBalances = false) => {
    const invalidations = [
      queryClient.invalidateQueries({ queryKey: salesQueryKeys.all }),
    ];
    if (affectsBalances) {
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: masterDataQueryKeys.products.all,
        }),
        queryClient.invalidateQueries({
          queryKey: masterDataQueryKeys.businessPartners.all,
        }),
      );
    }
    await Promise.all(invalidations);
  };
}

export function useCreateSale() {
  const invalidate = useSaleInvalidation();
  return useMutation({
    mutationFn: (input: SaleInput) => createSale(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateSale() {
  const invalidate = useSaleInvalidation();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SaleInput }) =>
      updateSale(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useRemoveSale() {
  const invalidate = useSaleInvalidation();
  return useMutation({
    mutationFn: removeSale,
    onSuccess: () => invalidate(),
  });
}

export function usePostSale() {
  const invalidate = useSaleInvalidation();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: PostSaleInput }) =>
      postSale(id, input),
    onSuccess: () => invalidate(true),
  });
}

export function useCancelSale() {
  const invalidate = useSaleInvalidation();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelSale(id, reason),
    onSuccess: () => invalidate(true),
  });
}
