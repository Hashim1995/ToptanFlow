import { ApiProperty } from '@nestjs/swagger';
import { CurrencyResponseDto } from './currency-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';

export class PaginatedCurrenciesResponseDto {
  @ApiProperty({ type: [CurrencyResponseDto] })
  data: CurrencyResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
