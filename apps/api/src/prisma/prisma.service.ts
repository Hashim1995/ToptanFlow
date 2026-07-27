import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

/**
 * Wraps the generated Prisma client (apps/api/prisma/schema.prisma, per
 * ADR-014) as an injectable NestJS provider with a graceful connection
 * lifecycle: connect once on module init, disconnect once on module
 * destroy. Registered globally via `PrismaModule` so every future module can
 * inject it without re-declaring the dependency.
 *
 * This client uses Prisma's driver-adapter architecture (the generated
 * client under `apps/api/generated/prisma` has no engine of its own and
 * requires an explicit adapter): `@prisma/adapter-pg` wraps the `pg` driver
 * already used elsewhere in this project (ADR-008, PostgreSQL). This is a
 * required wiring detail for the already-approved Prisma/PostgreSQL stack,
 * not a new architectural decision — no Prisma schema or business model
 * changes were made to accommodate it.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: configService.get<string>('DATABASE_URL'),
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to the database.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Disconnected from the database.');
  }
}
