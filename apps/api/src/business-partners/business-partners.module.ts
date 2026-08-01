import { Module } from '@nestjs/common';
import { NumberSequencesModule } from '../number-sequences/number-sequences.module';
import { BusinessPartnersController } from './business-partners.controller';
import { BusinessPartnersService } from './business-partners.service';
import { PartnerDebtBalanceService } from './partner-debt-balance.service';

@Module({
  imports: [NumberSequencesModule],
  controllers: [BusinessPartnersController],
  providers: [BusinessPartnersService, PartnerDebtBalanceService],
  exports: [PartnerDebtBalanceService],
})
export class BusinessPartnersModule {}
