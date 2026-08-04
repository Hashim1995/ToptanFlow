import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Space, Typography, message } from 'antd';
import { mapApiError } from '../../../api/map-api-error';
import {
  fetchPushPublicKey,
  fetchPushStatus,
  subscribePush,
  unsubscribePush,
} from '../api/push.api';
import { AUTH_LABELS } from './labels';
import {
  arrayBufferToBase64Url,
  isIosDevice,
  isPushUnsupported,
  isStandaloneDisplay,
  type PushClientState,
  urlBase64ToUint8Array,
} from './push-support';

const { Paragraph, Text } = Typography;

function permissionState(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

async function resolvePushClientState(): Promise<PushClientState> {
  if (isPushUnsupported()) return 'unsupported';
  if (isIosDevice() && !isStandaloneDisplay()) return 'ios_needs_homescreen';

  const permission = permissionState();
  if (permission === 'denied') return 'permission_denied';

  const publicKey = await fetchPushPublicKey();
  if (!publicKey.enabled || !publicKey.publicKey) return 'server_disabled';

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing?.endpoint) {
    const status = await fetchPushStatus(existing.endpoint);
    if (status.endpointActive) return 'subscribed';
  }

  if (permission === 'default') return 'permission_default';
  return 'not_subscribed';
}

export function PushNotificationSettingsCard() {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { refetch, isPending, isError, data, error } = useQuery({
    queryKey: ['push', 'client-status'],
    queryFn: resolvePushClientState,
    retry: false,
  });

  const state: PushClientState = isPending
    ? 'loading'
    : isError
      ? 'error'
      : (data ?? 'error');

  const errorText =
    actionError ?? (isError ? mapApiError(error).userMessage : null);

  async function refresh() {
    setActionError(null);
    await refetch();
  }
  async function enableNotifications() {
    setBusy(true);
    setActionError(null);
    try {
      if (isPushUnsupported()) {
        await refresh();
        return;
      }
      if (isIosDevice() && !isStandaloneDisplay()) {
        await refresh();
        return;
      }

      const publicKey = await fetchPushPublicKey();
      if (!publicKey.enabled || !publicKey.publicKey) {
        await refresh();
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        await refresh();
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          publicKey.publicKey,
        ) as BufferSource,
      });

      const json = subscription.toJSON();
      const endpoint = json.endpoint;
      const p256dh = json.keys?.p256dh;
      const auth = json.keys?.auth;
      if (!endpoint || !p256dh || !auth) {
        const keyP256 = subscription.getKey('p256dh');
        const keyAuth = subscription.getKey('auth');
        if (!keyP256 || !keyAuth) {
          throw new Error('Push subscription keys missing');
        }
        await subscribePush({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64Url(keyP256),
            auth: arrayBufferToBase64Url(keyAuth),
          },
          userAgent: navigator.userAgent,
        });
      } else {
        await subscribePush({
          endpoint,
          keys: { p256dh, auth },
          userAgent: navigator.userAgent,
        });
      }

      message.success(AUTH_LABELS.pushEnableSuccess);
      await refresh();
    } catch (error) {
      setActionError(mapApiError(error).userMessage);
    } finally {
      setBusy(false);
    }
  }

  async function disableNotifications() {
    setBusy(true);
    setActionError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await unsubscribePush(existing.endpoint);
        await existing.unsubscribe();
      }
      message.success(AUTH_LABELS.pushDisableSuccess);
      await refresh();
    } catch (error) {
      setActionError(mapApiError(error).userMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {AUTH_LABELS.pushDescription}
      </Paragraph>

      {state === 'loading' ? (
        <Text type="secondary">{AUTH_LABELS.pushLoading}</Text>
      ) : null}

      {state === 'unsupported' ? (
        <Alert type="warning" showIcon message={AUTH_LABELS.pushUnsupported} />
      ) : null}

      {state === 'ios_needs_homescreen' ? (
        <Alert
          type="info"
          showIcon
          message={AUTH_LABELS.pushIosHomescreenTitle}
          description={AUTH_LABELS.pushIosHomescreenDescription}
        />
      ) : null}

      {state === 'permission_denied' ? (
        <Alert type="warning" showIcon message={AUTH_LABELS.pushDenied} />
      ) : null}

      {state === 'server_disabled' ? (
        <Alert type="info" showIcon message={AUTH_LABELS.pushServerDisabled} />
      ) : null}

      {(state === 'error' || actionError) && errorText ? (
        <Alert type="error" showIcon message={errorText} />
      ) : null}

      {state === 'subscribed' ? (
        <Alert type="success" showIcon message={AUTH_LABELS.pushSubscribed} />
      ) : null}

      {state === 'permission_default' ||
      state === 'not_subscribed' ||
      state === 'error' ? (
        <Button
          type="primary"
          loading={busy}
          onClick={() => void enableNotifications()}
        >
          {AUTH_LABELS.pushEnable}
        </Button>
      ) : null}

      {state === 'subscribed' ? (
        <Button
          danger
          loading={busy}
          onClick={() => void disableNotifications()}
        >
          {AUTH_LABELS.pushDisable}
        </Button>
      ) : null}
    </Space>
  );
}
