/** Vitest stub for vite-plugin-pwa virtual module. */
export function registerSW(options?: {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}): (reloadPage?: boolean) => Promise<void> {
  void options;
  return async () => undefined;
}
