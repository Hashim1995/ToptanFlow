import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
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
import { CashTransactionsService } from './cash-transactions.service';
import {
  CancelCashTransactionDto,
  CancelCashTransferDto,
  CreateCashInDto,
  CreateCashOutDto,
  CreateCashTransferDto,
  CreateCustomerReceiptDto,
  CreateExpenseDto,
  CreateSupplierPaymentDto,
} from './dto/create-cash-transaction.dto';
import { CashTransferResponseDto } from './dto/cash-transfer-response.dto';
import {
  CashTransactionResponseDto,
  ListCashTransactionsQueryDto,
} from './dto/list-cash-transactions-query.dto';

@ApiTags('Cash Transactions')
@Controller('cash-transactions')
export class CashTransactionsController {
  constructor(
    private readonly cashTransactionsService: CashTransactionsService,
  ) {}

  @Post('cash-in')
  @ApiOperation({
    summary: 'Post Cash In (from Business Partner)',
    description:
      'ADR-038: requires partner; cash ↑; partner debt ↓. Optional saleId for traceability. Persists as CUSTOMER_RECEIPT.',
  })
  @ApiCreatedResponse({ type: CashTransactionResponseDto })
  @ApiBadRequestResponse()
  cashIn(
    @Body() dto: CreateCashInDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CashTransactionResponseDto> {
    return this.cashTransactionsService.cashIn(dto, user.id);
  }

  @Post('cash-out')
  @ApiOperation({
    summary: 'Post Cash Out (to Business Partner)',
    description:
      'ADR-038: requires partner; cash ↓; partner debt ↑. Optional purchaseId for traceability. Persists as SUPPLIER_PAYMENT. Negative balance requires reason (ADR-037).',
  })
  @ApiCreatedResponse({ type: CashTransactionResponseDto })
  @ApiBadRequestResponse()
  cashOut(
    @Body() dto: CreateCashOutDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CashTransactionResponseDto> {
    return this.cashTransactionsService.cashOut(dto, user.id);
  }

  @Post('expense')
  @ApiOperation({
    summary: 'Post Expense',
    description:
      'ADR-038: Expense Category + description required. Cash ↓; no partner debt.',
  })
  @ApiCreatedResponse({ type: CashTransactionResponseDto })
  @ApiBadRequestResponse()
  expense(
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CashTransactionResponseDto> {
    return this.cashTransactionsService.expense(dto, user.id);
  }

  @Post('transfer')
  @ApiOperation({
    summary: 'Post Cash Transfer',
    description:
      'ADR-034 / ADR-038: atomic source → destination; Total Company Cash unchanged; not income/expense.',
  })
  @ApiCreatedResponse({ type: CashTransferResponseDto })
  @ApiBadRequestResponse()
  transfer(
    @Body() dto: CreateCashTransferDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CashTransferResponseDto> {
    return this.cashTransactionsService.transfer(dto, user.id);
  }

  @Post('customer-receipt')
  @ApiOperation({
    summary: 'Alias: Cash In (legacy route name)',
    description: 'Same as POST /cash-transactions/cash-in (ADR-038).',
    deprecated: true,
  })
  @ApiCreatedResponse({ type: CashTransactionResponseDto })
  @ApiBadRequestResponse()
  customerReceipt(
    @Body() dto: CreateCustomerReceiptDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CashTransactionResponseDto> {
    return this.cashTransactionsService.customerReceipt(dto, user.id);
  }

  @Post('supplier-payment')
  @ApiOperation({
    summary: 'Alias: Cash Out (legacy route name)',
    description: 'Same as POST /cash-transactions/cash-out (ADR-038).',
    deprecated: true,
  })
  @ApiCreatedResponse({ type: CashTransactionResponseDto })
  @ApiBadRequestResponse()
  supplierPayment(
    @Body() dto: CreateSupplierPaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CashTransactionResponseDto> {
    return this.cashTransactionsService.supplierPayment(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List Cash Transactions' })
  list(@Query() query: ListCashTransactionsQueryDto) {
    return this.cashTransactionsService.list(query);
  }

  @Get('transfers/:id')
  @ApiOkResponse({ type: CashTransferResponseDto })
  @ApiNotFoundResponse()
  getTransfer(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CashTransferResponseDto> {
    return this.cashTransactionsService.getTransferById(id);
  }

  @Post('transfers/:id/cancel')
  @ApiOperation({ summary: 'Cancel Cash Transfer (both legs)' })
  @ApiOkResponse({ type: CashTransferResponseDto })
  @ApiConflictResponse()
  @ApiBadRequestResponse()
  cancelTransfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelCashTransferDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CashTransferResponseDto> {
    return this.cashTransactionsService.cancelTransfer(id, dto, user.id);
  }

  @Get(':id')
  @ApiOkResponse({ type: CashTransactionResponseDto })
  @ApiNotFoundResponse()
  getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CashTransactionResponseDto> {
    return this.cashTransactionsService.getById(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel Cash Transaction (reversal)' })
  @ApiOkResponse({ type: CashTransactionResponseDto })
  @ApiConflictResponse()
  @ApiBadRequestResponse()
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelCashTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CashTransactionResponseDto> {
    return this.cashTransactionsService.cancel(id, dto, user.id);
  }
}
