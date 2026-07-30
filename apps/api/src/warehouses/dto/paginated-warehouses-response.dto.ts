import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination/pagination-meta.dto';
import { WarehouseResponseDto } from './warehouse-response.dto';

export class PaginatedWarehousesResponseDto {
  @ApiProperty({ type: [WarehouseResponseDto] })
  data!: WarehouseResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
