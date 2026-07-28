import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterDataQueryKeys } from './master-data-query-keys';
import type { MasterDataListQuery } from './master-data.types';
import {
  createCurrency,
  deactivateCurrency,
  getCurrency,
  listCurrencies,
  updateCurrency,
  type CreateCurrencyInput,
  type UpdateCurrencyInput,
} from './currencies.api';

export function useCurrenciesList(query: MasterDataListQuery) {
  return useQuery({
    queryKey: masterDataQueryKeys.currencies.list(query),
    queryFn: () => listCurrencies(query),
  });
}

export function useCurrency(id: string | undefined) {
  return useQuery({
    queryKey: masterDataQueryKeys.currencies.detail(id ?? ''),
    queryFn: () => getCurrency(id!),
    enabled: Boolean(id),
  });
}

export function useCreateCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCurrencyInput) => createCurrency(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.currencies.all,
      });
    },
  });
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCurrencyInput }) =>
      updateCurrency(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.currencies.all,
      });
    },
  });
}

export function useDeactivateCurrency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateCurrency(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.currencies.all,
      });
    },
  });
}
