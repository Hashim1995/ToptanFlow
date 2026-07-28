import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination/pagination-meta.dto';
import { BusinessPartnerResponseDto } from './business-partner-response.dto';

export class PaginatedBusinessPartnersResponseDto {
  @ApiProperty({ type: [BusinessPartnerResponseDto] })
  data!: BusinessPartnerResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
