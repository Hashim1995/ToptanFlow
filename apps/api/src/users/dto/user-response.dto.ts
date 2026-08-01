import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Əli Məmmədov' })
  fullName: string;

  @ApiProperty({ example: 'ali' })
  username: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-07-29T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-29T00:00:00.000Z' })
  updatedAt: Date;
}
