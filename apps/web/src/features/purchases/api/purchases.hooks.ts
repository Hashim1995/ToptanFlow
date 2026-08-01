import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterDataQueryKeys } from '../../master-data/api/master-data-query-keys';
import {
  cancelPurchase,
  createPurchase,
  getPurchase,
  listPurchases,
  postPurchase,
  removePurchase,
  updatePurchase,
  type PurchaseInput,
  type PurchaseListQuery,
} from './purchases.api';
import { purchasesQueryKeys } from './purchases-query-keys';

export function usePurchasesList(query: PurchaseListQuery) {
  return useQuery({
    queryKey: purchasesQueryKeys.list(query),
    queryFn: () => listPurchases(query),
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
    mutationFn: postPurchase,
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
