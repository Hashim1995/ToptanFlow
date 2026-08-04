import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { CashAccountsService } from './cash-accounts.service';
import { CashReportsService } from './cash-reports.service';
import { CreateCashAccountDto } from './dto/create-cash-account.dto';
import {
  CashAccountResponseDto,
  CashWorkspaceOverviewResponseDto,
  DeactivateCashAccountDto,
  TotalCompanyCashResponseDto,
} from './dto/cash-account-response.dto';
import {
  CashAccountStatementResponseDto,
  CashPeriodSummaryQueryDto,
  CashPeriodSummaryResponseDto,
  CashReportDateRangeQueryDto,
} from './dto/cash-report-response.dto';
import { ListCashAccountsQueryDto } from './dto/list-cash-accounts-query.dto';
import { UpdateCashAccountDto } from './dto/update-cash-account.dto';

@ApiTags('Cash Accounts')
@Controller('cash-accounts')
export class CashAccountsController {
  constructor(
    private readonly cashAccountsService: CashAccountsService,
    private readonly cashReportsService: CashReportsService,
  ) {}

  @Get('summary/total-company-cash')
  @ApiOperation({
    summary: 'Total Company Cash',
    description:
      'Sum of currentBalance for all active Cash Accounts (ADR-032).',
  })
  @ApiOkResponse({ type: TotalCompanyCashResponseDto })
  totalCompanyCash(): Promise<TotalCompanyCashResponseDto> {
    return this.cashAccountsService.totalCompanyCash();
  }

  @Get('summary/workspace')
  @ApiOperation({
    summary: 'Cash workspace overview',
    description:
      'Active accounts with balances, today’s Cash In / Cash Out / Expenses, and Total Company Cash (US-043 / ADR-038).',
  })
  @ApiOkResponse({ type: CashWorkspaceOverviewResponseDto })
  workspaceOverview(): Promise<CashWorkspaceOverviewResponseDto> {
    return this.cashAccountsService.workspaceOverview();
  }

  @Get('reports/period-summary')
  @ApiOperation({
    summary: 'Cash period summary report',
    description:
      'Period Cash In/Out/Expense/Transfer totals. Transfers and reversals excluded from income/expense turnover (US-049).',
  })
  @ApiOkResponse({ type: CashPeriodSummaryResponseDto })
  periodSummary(
    @Query() query: CashPeriodSummaryQueryDto,
  ): Promise<CashPeriodSummaryResponseDto> {
    return this.cashReportsService.getPeriodSummary(query);
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Create Cash Account' })
  @ApiCreatedResponse({ type: CashAccountResponseDto })
  @ApiConflictResponse()
  @ApiBadRequestResponse()
  create(
    @Body() dto: CreateCashAccountDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CashAccountResponseDto> {
    return this.cashAccountsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List Cash Accounts' })
  list(@Query() query: ListCashAccountsQueryDto) {
    return this.cashAccountsService.list(query);
  }

  @Get(':id/statement')
  @ApiOperation({
    summary: 'Cash Account running-balance statement',
    description:
      'Opening/closing balance and lines for a date range. Cancelled rows visible; only Posted (incl. Reversal) change running balance (US-049).',
  })
  @ApiOkResponse({ type: CashAccountStatementResponseDto })
  @ApiNotFoundResponse()
  statement(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CashReportDateRangeQueryDto,
  ): Promise<CashAccountStatementResponseDto> {
    return this.cashReportsService.getAccountStatement(id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Cash Account' })
  @ApiOkResponse({ type: CashAccountResponseDto })
  @ApiNotFoundResponse()
  getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CashAccountResponseDto> {
    return this.cashAccountsService.getById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update Cash Account metadata',
    description:
      'Does not allow changing currentBalance directly (ADR-033). Super Admin may correct openingBalance via OPENING_BALANCE reverse+repost (CHANGE-028).',
  })
  @ApiOkResponse({ type: CashAccountResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCashAccountDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CashAccountResponseDto> {
    return this.cashAccountsService.update(id, dto, user.isSuperAdmin, user.id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate Cash Account' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeactivateCashAccountDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CashAccountResponseDto> {
    return this.cashAccountsService.deactivate(id, user.id, dto.reason);
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate Cash Account' })
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CashAccountResponseDto> {
    return this.cashAccountsService.reactivate(id);
  }
}
