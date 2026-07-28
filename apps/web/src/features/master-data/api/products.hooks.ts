import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterDataQueryKeys } from './master-data-query-keys';
import {
  createProduct,
  deactivateProduct,
  getProduct,
  listProducts,
  updateProduct,
  type CreateProductInput,
  type ProductListQuery,
  type UpdateProductInput,
} from './products.api';

export function useProductsList(query: ProductListQuery) {
  return useQuery({
    queryKey: masterDataQueryKeys.products.list(query),
    queryFn: () => listProducts(query),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: masterDataQueryKeys.products.detail(id ?? ''),
    queryFn: () => getProduct(id!),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.products.all,
      });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      updateProduct(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.products.all,
      });
    },
  });
}

export function useDeactivateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.products.all,
      });
    },
  });
}
