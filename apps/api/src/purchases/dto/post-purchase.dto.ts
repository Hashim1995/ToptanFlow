import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { ImmediatePaymentDto } from '../../sales/dto/post-sale.dto';

export class PostPurchaseDto {
  @ApiPropertyOptional({ type: ImmediatePaymentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ImmediatePaymentDto)
  immediatePayment?: ImmediatePaymentDto;
}
