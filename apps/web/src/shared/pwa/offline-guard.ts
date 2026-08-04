import { PWA_LABELS } from './labels';

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

export function isMutatingHttpMethod(method: string | undefined): boolean {
  if (!method) return false;
  return MUTATING_METHODS.has(method.toLowerCase());
}

export function createOfflineMutationError(): Error & {
  code: string;
  isOfflineMutation: true;
} {
  const error = new Error(PWA_LABELS.offlineSubmitBlocked) as Error & {
    code: string;
    isOfflineMutation: true;
  };
  error.code = 'ERR_OFFLINE_MUTATION';
  error.isOfflineMutation = true;
  return error;
}

export function isOfflineMutationError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isOfflineMutation' in error &&
    (error as { isOfflineMutation?: unknown }).isOfflineMutation === true
  );
}
