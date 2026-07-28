import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterDataQueryKeys } from './master-data-query-keys';
import type { MasterDataListQuery } from './master-data.types';
import {
  createUnit,
  deactivateUnit,
  getUnit,
  listUnits,
  updateUnit,
  type CreateUnitInput,
  type UpdateUnitInput,
} from './units.api';

export function useUnitsList(query: MasterDataListQuery) {
  return useQuery({
    queryKey: masterDataQueryKeys.units.list(query),
    queryFn: () => listUnits(query),
  });
}

export function useUnit(id: string | undefined) {
  return useQuery({
    queryKey: masterDataQueryKeys.units.detail(id ?? ''),
    queryFn: () => getUnit(id!),
    enabled: Boolean(id),
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUnitInput) => createUnit(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.units.all,
      });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUnitInput }) =>
      updateUnit(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.units.all,
      });
    },
  });
}

export function useDeactivateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateUnit(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.units.all,
      });
    },
  });
}
