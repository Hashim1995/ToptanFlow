import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination/pagination-meta.dto';
import { SaleListItemResponseDto } from './sale-list-item-response.dto';

export class PaginatedSalesResponseDto {
  @ApiProperty({ type: [SaleListItemResponseDto] })
  data!: SaleListItemResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
