import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products-response.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductTypeApi } from './dto/product-type.enum';
import {
  AdjustProductQuantityDto,
  ProductQuantityHistoryResponseDto,
} from './dto/adjust-product-quantity.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a product',
    description:
      'Product.code is allocated by the backend (ADR-024). Clients must not supply code. currentQuantity starts at 0 (ADR-029).',
  })
  @ApiBody({
    type: CreateProductDto,
    examples: {
      default: {
        value: {
          name: 'Parça məhsul',
          type: ProductTypeApi.FINISHED_GOOD,
          unitId: '22222222-2222-4222-8222-222222222222',
          categoryId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          standardSalePrice: '12.5000',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({
    description:
      'Invalid field values, inactive unit, invalid decimals, or forbidden properties (e.g. code)',
  })
  @ApiNotFoundResponse({ description: 'Unit not found' })
  @ApiConflictResponse({ description: 'Product code already exists' })
  create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List products with pagination, search, and filters',
  })
  @ApiOkResponse({ type: PaginatedProductsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  list(
    @Query() query: ListProductsQueryDto,
  ): Promise<PaginatedProductsResponseDto> {
    return this.productsService.list(query);
  }

  @Get(':id/quantity-history')
  @ApiOperation({
    summary: 'List product quantity history (ADR-029)',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductQuantityHistoryResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Product not found' })
  listQuantityHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.productsService.listQuantityHistory(id, query);
  }

  @Post(':id/quantity-adjustments')
  @ApiOperation({
    summary: 'Post a manual product quantity adjustment (ADR-029)',
    description:
      'Requires a reason. May leave currentQuantity negative when authorized (ADR-025 v1: all active users) with reason.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: AdjustProductQuantityDto })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid quantity or missing reason' })
  @ApiForbiddenResponse({ description: 'Negative quantity not permitted' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  adjustQuantity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustProductQuantityDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProductResponseDto> {
    return this.productsService.adjustQuantity(id, dto, user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a product by id',
    description:
      'Returns the product whether active or inactive (for historical and administrative use).',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponseDto> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a product (partial)',
    description:
      'Inactive products may be updated for administrative correction. ' +
      'PATCH may set isActive true to reactivate, or false to deactivate. ' +
      'Product.code and currentQuantity are not accepted here (ADR-024 / ADR-029).',
  })
  @ApiBody({ type: UpdateProductDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({
    description:
      'Invalid UUID, empty update body, invalid field values, inactive unit assignment, or forbidden properties (e.g. code)',
  })
  @ApiNotFoundResponse({ description: 'Product or unit not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate a product (soft delete)',
    description:
      'Sets isActive to false without physically deleting the record. ' +
      'Idempotent when the product is already inactive. ' +
      'Product code remains reserved and historical relations stay intact.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.deactivate(id);
  }
}
