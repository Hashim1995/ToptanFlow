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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { ListProductCategoriesQueryDto } from './dto/list-product-categories-query.dto';
import { PaginatedProductCategoriesResponseDto } from './dto/paginated-product-categories-response.dto';
import { ProductCategoryResponseDto } from './dto/product-category-response.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { ProductCategoriesService } from './product-categories.service';

@ApiTags('Product categories')
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(
    private readonly productCategoriesService: ProductCategoriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a product category' })
  @ApiCreatedResponse({ type: ProductCategoryResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid or empty field values' })
  @ApiConflictResponse({ description: 'Category name already exists' })
  create(
    @Body() dto: CreateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    return this.productCategoriesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List product categories with pagination and filters',
  })
  @ApiOkResponse({ type: PaginatedProductCategoriesResponseDto })
  list(
    @Query() query: ListProductCategoriesQueryDto,
  ): Promise<PaginatedProductCategoriesResponseDto> {
    return this.productCategoriesService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product category by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductCategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductCategoryResponseDto> {
    return this.productCategoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product category' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductCategoryResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid values or empty update body' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiConflictResponse({ description: 'Category name already exists' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductCategoryDto,
  ): Promise<ProductCategoryResponseDto> {
    return this.productCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate a product category (soft delete)',
    description:
      'Sets isActive to false. Idempotent when already inactive. Does not physically delete.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ProductCategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Category not found' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductCategoryResponseDto> {
    return this.productCategoriesService.deactivate(id);
  }
}
