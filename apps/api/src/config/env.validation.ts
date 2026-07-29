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

/**
 * Declares every environment variable the backend requires at startup, and
 * how it is validated. This is infrastructure/bootstrap configuration only —
 * it enforces no business rule and belongs to no business module.
 *
 * `DATABASE_URL` has no default: startup must fail fast if it is missing,
 * since the backend cannot be the authoritative source of business data
 * (ADR-003) without a database connection. The remaining variables have
 * safe, non-business defaults so local development works with a minimal
 * `.env` file.
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
   */
  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET = 'dev-only-jwt-access-secret-change-me';

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

  return validatedConfig;
}
