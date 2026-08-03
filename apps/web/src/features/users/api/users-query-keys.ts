import type { UsersListQuery } from './users.api';

export const usersQueryKeys = {
  all: ['users'] as const,
  list: (query: UsersListQuery) => ['users', 'list', query] as const,
};
