import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cashQueryKeys } from '../../cash/api/cash-query-keys';
import { masterDataQueryKeys } from '../../master-data/api/master-data-query-keys';
import {
  cancelPurchase,
  createPurchase,
  getPurchase,
  listPurchases,
  postPurchase,
  removePurchase,
  updatePurchase,
  type PostPurchaseInput,
  type PurchaseInput,
  type PurchaseListQuery,
} from './purchases.api';
import { purchasesQueryKeys } from './purchases-query-keys';

export function usePurchasesList(
  query: PurchaseListQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: purchasesQueryKeys.list(query),
    queryFn: () => listPurchases(query),
    enabled: options?.enabled ?? true,
  });
}

export function usePurchase(id: string | undefined) {
  return useQuery({
    queryKey: purchasesQueryKeys.detail(id ?? ''),
    queryFn: () => getPurchase(id!),
    enabled: Boolean(id),
  });
}

function usePurchaseInvalidation() {
  const queryClient = useQueryClient();
  return async (affectsBalances = false) => {
    const invalidations = [
      queryClient.invalidateQueries({ queryKey: purchasesQueryKeys.all }),
    ];
    if (affectsBalances) {
      invalidations.push(
        queryClient.invalidateQueries({
          queryKey: masterDataQueryKeys.products.all,
        }),
        queryClient.invalidateQueries({
          queryKey: masterDataQueryKeys.businessPartners.all,
        }),
        queryClient.invalidateQueries({ queryKey: cashQueryKeys.all }),
      );
    }
    await Promise.all(invalidations);
  };
}

export function useCreatePurchase() {
  const invalidate = usePurchaseInvalidation();
  return useMutation({
    mutationFn: (input: PurchaseInput) => createPurchase(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdatePurchase() {
  const invalidate = usePurchaseInvalidation();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PurchaseInput }) =>
      updatePurchase(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useRemovePurchase() {
  const invalidate = usePurchaseInvalidation();
  return useMutation({
    mutationFn: removePurchase,
    onSuccess: () => invalidate(),
  });
}

export function usePostPurchase() {
  const invalidate = usePurchaseInvalidation();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: PostPurchaseInput }) =>
      postPurchase(id, input),
    onSuccess: () => invalidate(true),
  });
}

export function useCancelPurchase() {
  const invalidate = usePurchaseInvalidation();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelPurchase(id, reason),
    onSuccess: () => invalidate(true),
  });
}
