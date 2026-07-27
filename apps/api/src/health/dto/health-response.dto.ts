import { ApiProperty } from '@nestjs/swagger';

/**
 * Basic application health information only. Deliberately excludes database
 * connectivity, credentials, connection strings, or any other internal
 * infrastructure detail, per this task's explicit requirement.
 */
export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Application status.' })
  status: 'ok';

  @ApiProperty({
    example: 42,
    description: 'Seconds the process has been running.',
  })
  uptimeSeconds: number;

  @ApiProperty({
    example: '2026-07-28T00:00:00.000Z',
    description: 'Server time when checked.',
  })
  timestamp: string;
}
