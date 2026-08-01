import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination/pagination-meta.dto';
import { PurchaseListItemResponseDto } from './purchase-list-item-response.dto';

export class PaginatedPurchasesResponseDto {
  @ApiProperty({ type: [PurchaseListItemResponseDto] })
  data!: PurchaseListItemResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
