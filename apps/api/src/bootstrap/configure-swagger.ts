import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Sets up OpenAPI documentation for the REST API, per ADR-015 (REST with
 * OpenAPI). The generated document describes request/response shapes only;
 * it is never a second source of business truth — the backend's runtime
 * validation and calculation remain authoritative regardless of what is
 * documented here (ADR-003, ADR-015).
 */
export function configureSwagger(
  app: INestApplication,
  apiPrefix: string,
): void {
  const config = new DocumentBuilder()
    .setTitle('TOPTANFLOW API')
    .setDescription(
      'TOPTANFLOW backend REST API. See docs/decisions/ADR-015-rest-openapi.md.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
}
