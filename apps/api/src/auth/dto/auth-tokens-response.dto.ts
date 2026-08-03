import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ali' })
  username: string;

  @ApiProperty({ example: 'Əli Məmmədov' })
  fullName: string;

  @ApiProperty({
    example: false,
    description: 'Users-module Super Admin (ADR-039).',
  })
  isSuperAdmin: boolean;
}

export class AuthTokensResponseDto {
  @ApiProperty({
    description:
      'JWT access token (ADR-025; 24h). Keep in memory on the client.',
  })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({
    example: 86400,
    description: 'Access token lifetime in seconds.',
  })
  expiresIn: number;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
