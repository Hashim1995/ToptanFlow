import { Module } from '@nestjs/common';
import { NumberSequencesModule } from '../number-sequences/number-sequences.module';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';

@Module({
  imports: [NumberSequencesModule],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
