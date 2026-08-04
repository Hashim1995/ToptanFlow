import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Space } from 'antd';
import { registerSW } from 'virtual:pwa-register';
import { PWA_LABELS } from './labels';
import { useOnlineStatus } from './use-online-status';
import './pwa-runtime.css';

const INSTALL_DISMISS_KEY = 'toptanflow.pwa.install.dismissed';
const IOS_INSTALL_DISMISS_KEY = 'toptanflow.pwa.ios-install.dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type UpdateSW = (reloadPage?: boolean) => Promise<void>;

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const media = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone =
    'standalone' in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || iosStandalone;
}

function readDismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(key: string): void {
  try {
    localStorage.setItem(key, '1');
  } catch {
    // ignore quota / private mode
  }
}

function initialIosInstallVisible(): boolean {
  if (typeof window === 'undefined') return false;
  if (isStandaloneDisplay()) return false;
  return isIosDevice() && !readDismissed(IOS_INSTALL_DISMISS_KEY);
}

/**
 * PWA chrome: offline banner, deferred update prompt, optional install hint.
 * Update never auto-reloads — only after explicit "İndi yenilə".
 */
export function PwaRuntime() {
  const online = useOnlineStatus();
  const updateSWRef = useRef<UpdateSW | null>(null);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [showIosInstall, setShowIosInstall] = useState(initialIosInstallVisible);

  useEffect(() => {
    updateSWRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
    });
  }, []);

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    function onBeforeInstall(event: Event) {
      event.preventDefault();
      if (readDismissed(INSTALL_DISMISS_KEY)) return;
      setInstallEvent(event as BeforeInstallPromptEvent);
      setShowInstall(true);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  const handleUpdate = useCallback(() => {
    void updateSWRef.current?.(true);
  }, []);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setShowInstall(false);
    setInstallEvent(null);
    writeDismissed(INSTALL_DISMISS_KEY);
  }, [installEvent]);

  const dismissInstall = useCallback(() => {
    setShowInstall(false);
    setInstallEvent(null);
    writeDismissed(INSTALL_DISMISS_KEY);
  }, []);

  const dismissIosInstall = useCallback(() => {
    setShowIosInstall(false);
    writeDismissed(IOS_INSTALL_DISMISS_KEY);
  }, []);

  return (
    <div className="pwa-runtime-stack" aria-live="polite">
      {!online ? (
        <Alert
          className="pwa-runtime-alert"
          type="warning"
          showIcon
          banner
          message={PWA_LABELS.offlineBanner}
        />
      ) : null}

      {needRefresh ? (
        <Alert
          className="pwa-runtime-alert"
          type="info"
          showIcon
          banner
          message={PWA_LABELS.updateTitle}
          action={
            <Space size={8}>
              <Button size="small" type="primary" onClick={handleUpdate}>
                {PWA_LABELS.updateAction}
              </Button>
              <Button size="small" onClick={dismissUpdate}>
                {PWA_LABELS.updateDismiss}
              </Button>
            </Space>
          }
        />
      ) : null}

      {showInstall && installEvent ? (
        <Alert
          className="pwa-runtime-alert"
          type="success"
          showIcon
          banner
          closable
          onClose={dismissInstall}
          message={PWA_LABELS.installTitle}
          description={PWA_LABELS.installDescription}
          action={
            <Space size={8}>
              <Button
                size="small"
                type="primary"
                onClick={() => void handleInstall()}
              >
                {PWA_LABELS.installAction}
              </Button>
              <Button size="small" onClick={dismissInstall}>
                {PWA_LABELS.installDismiss}
              </Button>
            </Space>
          }
        />
      ) : null}

      {showIosInstall && !showInstall ? (
        <Alert
          className="pwa-runtime-alert"
          type="success"
          showIcon
          banner
          closable
          onClose={dismissIosInstall}
          message={PWA_LABELS.iosInstallTitle}
          description={PWA_LABELS.iosInstallDescription}
          action={
            <Button size="small" onClick={dismissIosInstall}>
              {PWA_LABELS.iosInstallDismiss}
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
