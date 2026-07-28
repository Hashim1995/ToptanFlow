import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination/pagination-meta.dto';
import { CurrencyResponseDto } from './currency-response.dto';

export class PaginatedCurrenciesResponseDto {
  @ApiProperty({ type: [CurrencyResponseDto] })
  data: CurrencyResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
