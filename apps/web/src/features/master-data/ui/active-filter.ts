export type ActiveFilterValue = 'all' | 'active' | 'inactive';

export function activeFilterToIsActive(
  value: ActiveFilterValue,
): boolean | undefined {
  if (value === 'active') return true;
  if (value === 'inactive') return false;
  return undefined;
}
