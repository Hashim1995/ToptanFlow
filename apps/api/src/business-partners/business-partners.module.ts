import { Module } from '@nestjs/common';
import { NumberSequencesModule } from '../number-sequences/number-sequences.module';
import { BusinessPartnersController } from './business-partners.controller';
import { BusinessPartnersService } from './business-partners.service';
import { PartnerDebtBalanceService } from './partner-debt-balance.service';
import { BusinessPartnerMovementReportService } from './business-partner-movement-report.service';

@Module({
  imports: [NumberSequencesModule],
  controllers: [BusinessPartnersController],
  providers: [
    BusinessPartnersService,
    PartnerDebtBalanceService,
    BusinessPartnerMovementReportService,
  ],
  exports: [PartnerDebtBalanceService],
})
export class BusinessPartnersModule {}
