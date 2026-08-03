import { httpClient } from '../../../api/http-client';

export type AppUser = {
  id: string;
  fullName: string;
  username: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UsersListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'username' | 'fullName' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedUsers = {
  data: AppUser[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type CreateUserInput = {
  fullName: string;
  username: string;
  password: string;
};

export type UpdateUserInput = {
  fullName?: string;
  username?: string;
  password?: string;
  isActive?: boolean;
};

export async function listUsers(
  query: UsersListQuery = {},
): Promise<PaginatedUsers> {
  const { data } = await httpClient.get<PaginatedUsers>('/users', {
    params: query,
  });
  return data;
}

export async function createUser(input: CreateUserInput): Promise<AppUser> {
  const { data } = await httpClient.post<AppUser>('/users', input);
  return data;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<AppUser> {
  const { data } = await httpClient.patch<AppUser>(`/users/${id}`, input);
  return data;
}

export async function deactivateUser(id: string): Promise<AppUser> {
  const { data } = await httpClient.delete<AppUser>(`/users/${id}`);
  return data;
}
