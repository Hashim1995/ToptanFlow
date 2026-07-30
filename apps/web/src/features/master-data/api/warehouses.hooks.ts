import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterDataQueryKeys } from './master-data-query-keys';
import {
  createWarehouse,
  deactivateWarehouse,
  getWarehouse,
  listWarehouses,
  updateWarehouse,
  type CreateWarehouseInput,
  type UpdateWarehouseInput,
  type WarehouseListQuery,
} from './warehouses.api';

export function useWarehousesList(query: WarehouseListQuery) {
  return useQuery({
    queryKey: masterDataQueryKeys.warehouses.list(query),
    queryFn: () => listWarehouses(query),
  });
}

export function useWarehouse(id: string | undefined) {
  return useQuery({
    queryKey: masterDataQueryKeys.warehouses.detail(id ?? ''),
    queryFn: () => getWarehouse(id!),
    enabled: Boolean(id),
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWarehouseInput) => createWarehouse(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.warehouses.all,
      });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWarehouseInput }) =>
      updateWarehouse(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.warehouses.all,
      });
    },
  });
}

export function useDeactivateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateWarehouse(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.warehouses.all,
      });
    },
  });
}
