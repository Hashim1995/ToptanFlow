import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordResponseDto {
  @ApiProperty({ example: true })
  ok!: true;

  @ApiProperty({
    example: true,
    description:
      'All refresh tokens were revoked and the refresh cookie cleared; client must re-authenticate.',
  })
  requiresReauth!: true;
}
