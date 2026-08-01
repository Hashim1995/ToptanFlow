import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';
import { PaginatedSalesResponseDto } from './dto/paginated-sales-response.dto';
import { PostSaleDto } from './dto/post-sale.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesService } from './sales.service';

@ApiTags('Sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a draft sale',
    description:
      'Document number is backend-allocated (SAL-…). Draft has no product-quantity, partner-debt, or cash effect (ADR-028/029/030).',
  })
  @ApiCreatedResponse({ type: SaleResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Partner or product not found' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSaleDto,
  ): Promise<SaleResponseDto> {
    return this.salesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List sales with pagination and filters' })
  @ApiOkResponse({ type: PaginatedSalesResponseDto })
  list(@Query() query: ListSalesQueryDto): Promise<PaginatedSalesResponseDto> {
    return this.salesService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale details' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: SaleResponseDto })
  @ApiNotFoundResponse({ description: 'Sale not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SaleResponseDto> {
    return this.salesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a draft sale',
    description: 'Rejected for POSTED or CANCELLED sales.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: SaleResponseDto })
  @ApiConflictResponse({ description: 'Not a draft' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSaleDto,
  ): Promise<SaleResponseDto> {
    return this.salesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a draft sale',
    description: 'Hard-deletes draft only. Posted/cancelled cannot be deleted.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiConflictResponse({ description: 'Not a draft' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.salesService.remove(id);
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Post a draft sale',
    description:
      'Decreases product quantities, increases partner signed debt, marks POSTED. Does not change cash (ADR-028). Optional negativeQuantityReason when stock is insufficient.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: SaleResponseDto })
  @ApiConflictResponse({ description: 'Already posted or not a draft' })
  post(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PostSaleDto,
  ): Promise<SaleResponseDto> {
    return this.salesService.post(id, user.id, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel a posted sale',
    description:
      'Requires reason. Reverses product quantities and partner debt via new history rows. Does not change cash.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: SaleResponseDto })
  @ApiConflictResponse({ description: 'Not posted or already cancelled' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CancelSaleDto,
  ): Promise<SaleResponseDto> {
    return this.salesService.cancel(id, user.id, dto);
  }
}
