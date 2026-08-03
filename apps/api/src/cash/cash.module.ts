import { Module } from '@nestjs/common';
import { BusinessPartnersModule } from '../business-partners/business-partners.module';
import { NumberSequencesModule } from '../number-sequences/number-sequences.module';
import { CashAccountsController } from './cash-accounts.controller';
import { CashAccountsService } from './cash-accounts.service';
import { CashBalanceService } from './cash-balance.service';
import { CashReportsService } from './cash-reports.service';
import { CashTransactionsController } from './cash-transactions.controller';
import { CashTransactionsService } from './cash-transactions.service';
import { ExpenseCategoriesController } from './expense-categories.controller';
import { ExpenseCategoriesService } from './expense-categories.service';

@Module({
  imports: [NumberSequencesModule, BusinessPartnersModule],
  controllers: [
    CashAccountsController,
    CashTransactionsController,
    ExpenseCategoriesController,
  ],
  providers: [
    CashBalanceService,
    CashAccountsService,
    CashTransactionsService,
    CashReportsService,
    ExpenseCategoriesService,
  ],
  exports: [
    CashBalanceService,
    CashAccountsService,
    CashTransactionsService,
    ExpenseCategoriesService,
  ],
})
export class CashModule {}
