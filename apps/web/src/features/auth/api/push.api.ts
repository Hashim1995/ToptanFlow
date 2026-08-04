import { httpClient } from '../../../api/http-client';

export type PushPublicKeyResponse = {
  publicKey: string | null;
  enabled: boolean;
};

export type PushStatusResponse = {
  configured: boolean;
  hasActiveSubscription: boolean;
  activeDeviceCount: number;
  endpointActive: boolean | null;
};

export type PushSubscriptionResponse = {
  id: string;
  endpoint: string;
  isActive: boolean;
  deviceLabel: string | null;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
};

export async function fetchPushPublicKey(): Promise<PushPublicKeyResponse> {
  const { data } = await httpClient.get<PushPublicKeyResponse>(
    '/push/public-key',
  );
  return data;
}

export async function fetchPushStatus(
  endpoint?: string,
): Promise<PushStatusResponse> {
  const { data } = await httpClient.get<PushStatusResponse>('/push/status', {
    params: endpoint ? { endpoint } : undefined,
  });
  return data;
}

export async function subscribePush(input: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
  deviceLabel?: string;
}): Promise<PushSubscriptionResponse> {
  const { data } = await httpClient.post<PushSubscriptionResponse>(
    '/push/subscriptions',
    input,
  );
  return data;
}

export async function unsubscribePush(endpoint: string): Promise<{ ok: true }> {
  const { data } = await httpClient.delete<{ ok: true }>('/push/subscriptions', {
    data: { endpoint },
  });
  return data;
}
