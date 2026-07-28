import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterDataQueryKeys } from './master-data-query-keys';
import type { MasterDataListQuery } from './master-data.types';
import {
  createProductCategory,
  deactivateProductCategory,
  getProductCategory,
  listProductCategories,
  updateProductCategory,
  type CreateProductCategoryInput,
  type UpdateProductCategoryInput,
} from './product-categories.api';

export function useProductCategoriesList(query: MasterDataListQuery) {
  return useQuery({
    queryKey: masterDataQueryKeys.productCategories.list(query),
    queryFn: () => listProductCategories(query),
  });
}

export function useProductCategory(id: string | undefined) {
  return useQuery({
    queryKey: masterDataQueryKeys.productCategories.detail(id ?? ''),
    queryFn: () => getProductCategory(id!),
    enabled: Boolean(id),
  });
}

export function useCreateProductCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductCategoryInput) =>
      createProductCategory(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.productCategories.all,
      });
    },
  });
}

export function useUpdateProductCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateProductCategoryInput;
    }) => updateProductCategory(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.productCategories.all,
      });
    },
  });
}

export function useDeactivateProductCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateProductCategory(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.productCategories.all,
      });
    },
  });
}
