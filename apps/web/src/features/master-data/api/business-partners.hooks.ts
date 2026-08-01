import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { masterDataQueryKeys } from './master-data-query-keys';
import {
  createBusinessPartner,
  deactivateBusinessPartner,
  getBusinessPartner,
  listBusinessPartners,
  updateBusinessPartner,
  type BusinessPartnerListQuery,
  type CreateBusinessPartnerInput,
  type UpdateBusinessPartnerInput,
} from './business-partners.api';

export function useBusinessPartnersList(query: BusinessPartnerListQuery) {
  return useQuery({
    queryKey: masterDataQueryKeys.businessPartners.list(query),
    queryFn: () => listBusinessPartners(query),
  });
}

export function useBusinessPartner(id: string | undefined) {
  return useQuery({
    queryKey: masterDataQueryKeys.businessPartners.detail(id ?? ''),
    queryFn: () => getBusinessPartner(id!),
    enabled: Boolean(id),
  });
}

export function useCreateBusinessPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBusinessPartnerInput) =>
      createBusinessPartner(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.businessPartners.all,
      });
    },
  });
}

export function useUpdateBusinessPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateBusinessPartnerInput;
    }) => updateBusinessPartner(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.businessPartners.all,
      });
    },
  });
}

export function useDeactivateBusinessPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateBusinessPartner(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: masterDataQueryKeys.businessPartners.all,
      });
    },
  });
}
