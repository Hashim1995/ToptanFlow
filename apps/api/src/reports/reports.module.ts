import { Module } from '@nestjs/common';
import { DailyBalanceReportService } from './daily-balance-report.service';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [DailyBalanceReportService],
})
export class ReportsModule {}
