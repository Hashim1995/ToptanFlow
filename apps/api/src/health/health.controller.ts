import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './dto/health-response.dto';

/**
 * Bootstrap-level health endpoint only (`GET /api/v1/health` once the global
 * prefix and URI versioning from `src/bootstrap/configure-app.ts` are
 * applied). Returns basic application health information only — no
 * database connectivity check, credentials, or infrastructure detail is
 * exposed, per this task's explicit requirement.
 *
 * TODO: a database-connectivity health check (e.g., a Prisma `$queryRaw`
 * ping) is a reasonable future extension, but is not implemented here since
 * this task's scope is limited to "basic application health information."
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Basic application health check' })
  @ApiOkResponse({ type: HealthResponseDto })
  check(): HealthResponseDto {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
