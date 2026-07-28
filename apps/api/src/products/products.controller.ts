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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products-response.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductTypeApi } from './dto/product-type.enum';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiBody({
    type: CreateProductDto,
    examples: {
      default: {
        value: {
          code: 'tx-001',
          name: 'Parça məhsul',
          type: ProductTypeApi.FINISHED_GOOD,
          unitId: '22222222-2222-4222-8222-222222222222',
          category: 'Tekstil',
          standardSalePrice: '12.5000',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid field values, inactive unit, or invalid decimals',
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
      'PATCH does not change isActive and cannot reactivate a product.',
  })
  @ApiBody({ type: UpdateProductDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({
    description:
      'Invalid UUID, empty update body, invalid field values, or inactive unit assignment',
  })
  @ApiNotFoundResponse({ description: 'Product or unit not found' })
  @ApiConflictResponse({ description: 'Product code already exists' })
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
