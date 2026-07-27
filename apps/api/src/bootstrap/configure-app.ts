import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AppBootstrapSettings {
  apiPrefix: string;
  port: number;
}

/**
 * Applies every cross-cutting bootstrap concern that does not belong to a
 * specific business module: global API prefix, URI versioning, the global
 * validation pipe, and CORS — each read from environment configuration
 * (`src/config/env.validation.ts`) rather than hardcoded.
 *
 * Kept as a standalone, callable function (rather than inline in
 * `main.ts`) so tests can reproduce the same production request-handling
 * behavior (e.g. `test/health.e2e-spec.ts`) without duplicating this logic.
 */
export function configureApp(app: INestApplication): AppBootstrapSettings {
  const configService = app.get(ConfigService);

  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const port = configService.get<number>('PORT', 3000);
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '');

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const allowedOrigins = corsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: true,
  });

  return { apiPrefix, port };
}
