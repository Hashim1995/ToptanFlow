import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type WebPushVapidConfig = {
  publicKey: string;
  privateKey: string;
  contact: string;
};

/**
 * Reads optional Web Push / VAPID configuration.
 * Local: missing keys disable sending with a clear warning.
 * Production: missing keys log an error when send is attempted; boot still succeeds.
 */
@Injectable()
export class PushConfigService implements OnModuleInit {
  private readonly logger = new Logger(PushConfigService.name);
  private warnedMissing = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    if (this.isConfigured()) {
      this.logger.log('Web Push VAPID configuration loaded');
      return;
    }
    const env = this.config.get<string>('NODE_ENV', 'development');
    if (env === 'production') {
      this.logger.error(
        'Web Push VAPID is not fully configured in production. Push sending is disabled until WEB_PUSH_VAPID_PUBLIC_KEY, WEB_PUSH_VAPID_PRIVATE_KEY, and WEB_PUSH_CONTACT are set.',
      );
    } else {
      this.logger.warn(
        'Web Push VAPID is not configured. Local push sending is disabled.',
      );
    }
    this.warnedMissing = true;
  }

  isConfigured(): boolean {
    const vapid = this.getVapidConfig();
    return vapid !== null;
  }

  getPublicKey(): string | null {
    const key = this.config
      .get<string>('WEB_PUSH_VAPID_PUBLIC_KEY', '')
      ?.trim();
    return key ? key : null;
  }

  getVapidConfig(): WebPushVapidConfig | null {
    const publicKey = this.config
      .get<string>('WEB_PUSH_VAPID_PUBLIC_KEY', '')
      ?.trim();
    const privateKey = this.config
      .get<string>('WEB_PUSH_VAPID_PRIVATE_KEY', '')
      ?.trim();
    const contact = this.config.get<string>('WEB_PUSH_CONTACT', '')?.trim();
    if (!publicKey || !privateKey || !contact) {
      return null;
    }
    return { publicKey, privateKey, contact };
  }

  getDispatchSecret(): string | null {
    const dedicated = this.config
      .get<string>('PUSH_DISPATCH_SECRET', '')
      ?.trim();
    if (dedicated) return dedicated;
    // Vercel Cron sends Authorization: Bearer $CRON_SECRET when configured.
    const cron = this.config.get<string>('CRON_SECRET', '')?.trim();
    return cron ? cron : null;
  }

  logMissingConfigIfNeeded(context: string): void {
    if (this.isConfigured()) return;
    if (!this.warnedMissing) {
      this.logger.error(
        `Web Push send skipped (${context}): VAPID configuration incomplete`,
      );
      this.warnedMissing = true;
    }
  }
}
