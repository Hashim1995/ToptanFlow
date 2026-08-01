import { Module } from '@nestjs/common';
import { NumberSequencesModule } from '../number-sequences/number-sequences.module';
import { ProductQuantityService } from './product-quantity.service';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [NumberSequencesModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductQuantityService],
  exports: [ProductsService, ProductQuantityService],
})
export class ProductsModule {}
