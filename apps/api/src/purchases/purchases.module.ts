import { Module } from '@nestjs/common';
import { BusinessPartnersModule } from '../business-partners/business-partners.module';
import { CashModule } from '../cash/cash.module';
import { NumberSequencesModule } from '../number-sequences/number-sequences.module';
import { ProductsModule } from '../products/products.module';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';

@Module({
  imports: [
    NumberSequencesModule,
    ProductsModule,
    BusinessPartnersModule,
    CashModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
