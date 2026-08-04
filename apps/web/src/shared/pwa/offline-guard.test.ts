import { describe, expect, it } from 'vitest';
import {
  createOfflineMutationError,
  isMutatingHttpMethod,
  isOfflineMutationError,
} from './offline-guard';

describe('offline-guard', () => {
  it('detects mutating HTTP methods', () => {
    expect(isMutatingHttpMethod('POST')).toBe(true);
    expect(isMutatingHttpMethod('patch')).toBe(true);
    expect(isMutatingHttpMethod('GET')).toBe(false);
    expect(isMutatingHttpMethod(undefined)).toBe(false);
  });

  it('marks offline mutation errors', () => {
    const error = createOfflineMutationError();
    expect(isOfflineMutationError(error)).toBe(true);
    expect(isOfflineMutationError(new Error('other'))).toBe(false);
  });
});
