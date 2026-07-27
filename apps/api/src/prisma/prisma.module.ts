import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Makes `PrismaService` available for injection anywhere in the application
 * without every consuming module needing to import `PrismaModule`
 * explicitly. `ConfigModule` is registered as global in `AppModule`, so
 * `ConfigService` (required by `PrismaService`) is already available here.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
