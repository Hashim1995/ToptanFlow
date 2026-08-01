import { Module } from '@nestjs/common';
import { BusinessPartnersModule } from '../business-partners/business-partners.module';
import { NumberSequencesModule } from '../number-sequences/number-sequences.module';
import { ProductsModule } from '../products/products.module';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

@Module({
  imports: [NumberSequencesModule, ProductsModule, BusinessPartnersModule],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
