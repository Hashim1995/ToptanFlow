import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { mapApiError } from './map-api-error';

describe('mapApiError', () => {
  it('maps network failures to Azerbaijani text', () => {
    const error = new AxiosError('Network Error');
    error.code = 'ERR_NETWORK';
    const mapped = mapApiError(error);
    expect(mapped.kind).toBe('network');
    expect(mapped.userMessage).toContain('Şəbəkə');
  });

  it('maps soft-duplicate conflict code', () => {
    const error = new AxiosError('Conflict');
    error.response = {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: {} } as never,
      data: {
        code: 'BUSINESS_PARTNER_DUPLICATE_SUSPECTED',
        candidates: [{ code: '0000001', name: 'Test' }],
      },
    };

    const mapped = mapApiError(error);
    expect(mapped.statusCode).toBe(409);
    expect(mapped.code).toBe('BUSINESS_PARTNER_DUPLICATE_SUSPECTED');
    expect(mapped.candidates).toHaveLength(1);
    expect(mapped.userMessage).toContain('tərəfdaş');
  });

  it('maps unknown non-axios errors', () => {
    const mapped = mapApiError(new Error('boom'));
    expect(mapped.kind).toBe('unknown');
    expect(mapped.userMessage.length).toBeGreaterThan(0);
  });
});
