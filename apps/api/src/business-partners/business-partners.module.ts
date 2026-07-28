import { Module } from '@nestjs/common';
import { NumberSequencesModule } from '../number-sequences/number-sequences.module';
import { BusinessPartnersController } from './business-partners.controller';
import { BusinessPartnersService } from './business-partners.service';

@Module({
  imports: [NumberSequencesModule],
  controllers: [BusinessPartnersController],
  providers: [BusinessPartnersService],
})
export class BusinessPartnersModule {}
