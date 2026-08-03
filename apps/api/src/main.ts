import './set-utc-timezone';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import { configureSwagger } from './bootstrap/configure-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { apiPrefix, port } = configureApp(app);
  configureSwagger(app, apiPrefix);

  // Ensures PrismaService.onModuleDestroy (graceful disconnect) runs on
  // process termination signals (e.g. SIGTERM), per this task's requirement.
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');
  const swaggerUrl = `http://localhost:${port}/${apiPrefix}/docs`;
  Logger.log(
    `TOPTANFLOW API listening on port ${port}, prefix "/${apiPrefix}"`,
    'Bootstrap',
  );
  Logger.log(`Swagger UI: ${swaggerUrl}`, 'Bootstrap');
}

void bootstrap();
