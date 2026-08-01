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
import { CancelPurchaseDto } from './dto/cancel-purchase.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { ListPurchasesQueryDto } from './dto/list-purchases-query.dto';
import { PaginatedPurchasesResponseDto } from './dto/paginated-purchases-response.dto';
import { PurchaseResponseDto } from './dto/purchase-response.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchasesService } from './purchases.service';

@ApiTags('Purchases')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a draft purchase',
    description:
      'Document number is backend-allocated (PUR-…). Draft has no product-quantity, partner-debt, or cash effect (ADR-028/029/030).',
  })
  @ApiCreatedResponse({ type: PurchaseResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  @ApiNotFoundResponse({ description: 'Partner or product not found' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePurchaseDto,
  ): Promise<PurchaseResponseDto> {
    return this.purchasesService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List purchases with pagination and filters' })
  @ApiOkResponse({ type: PaginatedPurchasesResponseDto })
  list(
    @Query() query: ListPurchasesQueryDto,
  ): Promise<PaginatedPurchasesResponseDto> {
    return this.purchasesService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase details' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PurchaseResponseDto })
  @ApiNotFoundResponse({ description: 'Purchase not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PurchaseResponseDto> {
    return this.purchasesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a draft purchase',
    description: 'Rejected for POSTED or CANCELLED purchases.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PurchaseResponseDto })
  @ApiConflictResponse({ description: 'Not a draft' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseDto,
  ): Promise<PurchaseResponseDto> {
    return this.purchasesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a draft purchase',
    description: 'Hard-deletes draft only. Posted/cancelled cannot be deleted.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiConflictResponse({ description: 'Not a draft' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.purchasesService.remove(id);
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Post (complete) a draft purchase',
    description:
      'Increases product quantities, decreases partner signed debt, marks POSTED. Does not change cash (ADR-028).',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PurchaseResponseDto })
  @ApiConflictResponse({ description: 'Already posted or not a draft' })
  post(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PurchaseResponseDto> {
    return this.purchasesService.post(id, user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel a posted purchase',
    description:
      'Requires reason. Reverses product quantities and partner debt via new history rows. Does not change cash.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PurchaseResponseDto })
  @ApiConflictResponse({ description: 'Not posted or already cancelled' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CancelPurchaseDto,
  ): Promise<PurchaseResponseDto> {
    return this.purchasesService.cancel(id, user.id, dto);
  }
}
