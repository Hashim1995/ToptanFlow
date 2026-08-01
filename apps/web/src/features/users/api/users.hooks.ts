import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersQueryKeys } from './users-query-keys';
import {
  createUser,
  deactivateUser,
  listUsers,
  updateUser,
  type CreateUserInput,
  type UpdateUserInput,
  type UsersListQuery,
} from './users.api';

export function useUsersList(query: UsersListQuery) {
  return useQuery({
    queryKey: usersQueryKeys.list(query),
    queryFn: () => listUsers(query),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      updateUser(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersQueryKeys.all });
    },
  });
}
