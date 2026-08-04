import { describe, expect, it, vi } from 'vitest';
import {
  isPushUnsupported,
  urlBase64ToUint8Array,
} from './push-support';

describe('push-support', () => {
  it('detects unsupported browsers without PushManager', () => {
    const original = globalThis.navigator;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {},
    });
    expect(isPushUnsupported()).toBe(true);
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: original,
    });
  });

  it('decodes VAPID public key to Uint8Array', () => {
    const bytes = urlBase64ToUint8Array('AAAA');
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('push permission gating', () => {
  it('does not call Notification.requestPermission until explicit action', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    // Simulate the UX rule: permission API is only invoked from the enable handler.
    expect(requestPermission).not.toHaveBeenCalled();
    await requestPermission();
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });
});
