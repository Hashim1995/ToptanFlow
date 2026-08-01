import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { BakuDateSerializationInterceptor } from '../common/datetime/baku-date-serialization.interceptor.js';

export interface AppBootstrapSettings {
  apiPrefix: string;
  port: number;
}

/**
 * Applies every cross-cutting bootstrap concern that does not belong to a
 * specific business module: global API prefix, URI versioning, the global
 * validation pipe, cookies, and CORS — each read from environment configuration
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
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const corsOrigins = configService.get<string>('CORS_ORIGINS', '');

  app.use(cookieParser());

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new BakuDateSerializationInterceptor());

  const allowedOrigins = corsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  // Development: reflect any Origin so local Vite / [::1] / alternate ports work.
  // Production: explicit CORS_ORIGINS allow-list only (empty = deny).
  const isDevelopment = nodeEnv === 'development';

  app.enableCors({
    origin: isDevelopment
      ? true
      : allowedOrigins.length > 0
        ? allowedOrigins
        : false,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  });

  return { apiPrefix, port };
}
