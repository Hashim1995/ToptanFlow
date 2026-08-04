import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

/**
 * Application runtime environment.
 *
 * TODO: the exact set of valid `NODE_ENV` values is a technical/infrastructure
 * detail, not a documented business rule. `development`/`test`/`production`
 * are the conventional Node.js values; revisit if the approved deployment
 * strategy (an unresolved Open Decision — see
 * docs/technical/system-architecture.md, "Known Open Decisions") requires
 * additional environments.
 */
export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

/** Default local-only JWT secret; must never be used when NODE_ENV=production. */
export const DEV_JWT_ACCESS_SECRET =
  'dev-only-jwt-access-secret-change-me';

/**
 * Declares every environment variable the backend requires at startup, and
 * how it is validated. This is infrastructure/bootstrap configuration only —
 * it enforces no business rule and belongs to no business module.
 *
 * `DATABASE_URL` has no default: startup must fail fast if it is missing,
 * since the backend cannot be the authoritative source of business data
 * (ADR-003) without a database connection. The remaining variables have
 * safe, non-business defaults so local development works with a minimal
 * `.env.development` (or legacy `.env`) file.
 */
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  API_PREFIX: string = 'api';

  /**
   * Comma-separated list of allowed CORS origins (e.g.
   * "https://app.example.com,https://admin.example.com").
   * Empty in development falls back to Vite local origins in configureApp;
   * empty in production disables cross-origin requests.
   */
  @IsString()
  CORS_ORIGINS = '';

  /**
   * Optional first-user bootstrap for empty databases (ADR-025 / seed).
   * Used only by `prisma db seed`; not required for API boot.
   */
  @IsOptional()
  @IsString()
  BOOTSTRAP_USERNAME = '';

  @IsOptional()
  @IsString()
  BOOTSTRAP_PASSWORD = '';

  @IsOptional()
  @IsString()
  BOOTSTRAP_FULL_NAME = '';

  /**
   * JWT access-token signing secret (ADR-025). Override in every non-local env.
   * Production rejects the local default (see validateEnv).
   */
  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET = DEV_JWT_ACCESS_SECRET;

  /** Access token lifetime (ADR-025: 24h). Parsed by @nestjs/jwt. */
  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRES_IN = '24h';

  /** Refresh cookie / token lifetime in days (ADR-025: 30). */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  JWT_REFRESH_EXPIRES_DAYS = 30;

  /** httpOnly cookie name for the opaque refresh token. */
  @IsString()
  @IsNotEmpty()
  REFRESH_COOKIE_NAME = 'refresh_token';
}

/**
 * Validates the process environment at application startup. Used as the
 * `validate` function passed to `ConfigModule.forRoot`, per the NestJS
 * `ConfigModule` configuration-validation pattern. Throws synchronously if
 * any required variable is missing or malformed, so the application never
 * boots into a partially-configured state.
 *
 * Local development defaults are unchanged. Production reads values from the
 * process environment (e.g. Vercel Project Settings) and rejects the
 * local-only JWT default and empty CORS allow-list.
 */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }

  if (validatedConfig.NODE_ENV === NodeEnv.Production) {
    if (
      !validatedConfig.JWT_ACCESS_SECRET ||
      validatedConfig.JWT_ACCESS_SECRET === DEV_JWT_ACCESS_SECRET
    ) {
      throw new Error(
        'Environment validation failed: JWT_ACCESS_SECRET must be set to a non-default value when NODE_ENV=production',
      );
    }
    if (!validatedConfig.CORS_ORIGINS.trim()) {
      throw new Error(
        'Environment validation failed: CORS_ORIGINS must be set when NODE_ENV=production',
      );
    }
  }

  return validatedConfig;
}
