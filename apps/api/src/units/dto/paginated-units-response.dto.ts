import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination/pagination-meta.dto';
import { UnitResponseDto } from './unit-response.dto';

export class PaginatedUnitsResponseDto {
  @ApiProperty({ type: [UnitResponseDto] })
  data: UnitResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
