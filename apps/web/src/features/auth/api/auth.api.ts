import { httpClient } from '../../../api/http-client';

export type AuthUser = {
  id: string;
  username: string;
  fullName: string;
  isSuperAdmin: boolean;
};

export type AuthTokensResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
};

export async function loginRequest(input: {
  username: string;
  password: string;
}): Promise<AuthTokensResponse> {
  const { data } = await httpClient.post<AuthTokensResponse>('/auth/login', input);
  return data;
}

export async function refreshRequest(): Promise<AuthTokensResponse> {
  const { data } = await httpClient.post<AuthTokensResponse>('/auth/refresh');
  return data;
}

export async function logoutRequest(): Promise<{ ok: true }> {
  const { data } = await httpClient.post<{ ok: true }>('/auth/logout');
  return data;
}
