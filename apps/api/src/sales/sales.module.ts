import { Module } from '@nestjs/common';
import { BusinessPartnersModule } from '../business-partners/business-partners.module';
import { NumberSequencesModule } from '../number-sequences/number-sequences.module';
import { ProductsModule } from '../products/products.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [NumberSequencesModule, ProductsModule, BusinessPartnersModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
