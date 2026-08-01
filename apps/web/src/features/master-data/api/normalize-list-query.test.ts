import { describe, expect, it } from 'vitest';
import { normalizeListQuery } from './normalize-list-query';

describe('normalizeListQuery', () => {
  it('omits undefined and empty strings', () => {
    expect(
      normalizeListQuery({
        page: 1,
        search: '  ',
        sortBy: undefined,
        isActive: true,
      }),
    ).toEqual({ page: 1, isActive: true });
  });

  it('keeps false and zero', () => {
    expect(
      normalizeListQuery({
        page: 0,
        isActive: false,
        isCustomer: false,
      }),
    ).toEqual({ page: 0, isActive: false, isCustomer: false });
  });

  it('trims non-empty strings', () => {
    expect(normalizeListQuery({ search: '  abc  ', type: 'FINISHED_GOOD' })).toEqual({
      search: 'abc',
      type: 'FINISHED_GOOD',
    });
  });
});
