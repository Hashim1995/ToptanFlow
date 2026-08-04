import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PushStatusQueryDto {
  @ApiPropertyOptional({
    description: 'Optional endpoint to check for the current user',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  endpoint?: string;
}
