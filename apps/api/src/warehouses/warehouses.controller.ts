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
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { ListWarehousesQueryDto } from './dto/list-warehouses-query.dto';
import { PaginatedWarehousesResponseDto } from './dto/paginated-warehouses-response.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehouseResponseDto } from './dto/warehouse-response.dto';
import { WarehousesService } from './warehouses.service';

@ApiTags('Warehouses')
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a warehouse' })
  @ApiCreatedResponse({ type: WarehouseResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid or empty field values' })
  @ApiConflictResponse({ description: 'Warehouse code already exists' })
  create(@Body() dto: CreateWarehouseDto): Promise<WarehouseResponseDto> {
    return this.warehousesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List warehouses with pagination and filters',
  })
  @ApiOkResponse({ type: PaginatedWarehousesResponseDto })
  list(
    @Query() query: ListWarehousesQueryDto,
  ): Promise<PaginatedWarehousesResponseDto> {
    return this.warehousesService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a warehouse by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: WarehouseResponseDto })
  @ApiNotFoundResponse({ description: 'Warehouse not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WarehouseResponseDto> {
    return this.warehousesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a warehouse' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: WarehouseResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid values or empty update body' })
  @ApiNotFoundResponse({ description: 'Warehouse not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseDto,
  ): Promise<WarehouseResponseDto> {
    return this.warehousesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate a warehouse (soft delete)',
    description:
      'Sets isActive to false. Idempotent when already inactive. Does not physically delete. Reactivate via PATCH isActive true.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: WarehouseResponseDto })
  @ApiNotFoundResponse({ description: 'Warehouse not found' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WarehouseResponseDto> {
    return this.warehousesService.deactivate(id);
  }
}
