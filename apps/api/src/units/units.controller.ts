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
  ApiTags,
} from '@nestjs/swagger';
import { CreateUnitDto } from './dto/create-unit.dto';
import { ListUnitsQueryDto } from './dto/list-units-query.dto';
import { PaginatedUnitsResponseDto } from './dto/paginated-units-response.dto';
import { UnitResponseDto } from './dto/unit-response.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitsService } from './units.service';

@ApiTags('Units')
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a unit of measure' })
  @ApiCreatedResponse({ type: UnitResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid or empty field values' })
  @ApiConflictResponse({ description: 'Unit code already exists' })
  create(@Body() dto: CreateUnitDto): Promise<UnitResponseDto> {
    return this.unitsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List units with pagination and filters' })
  @ApiOkResponse({ type: PaginatedUnitsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  list(@Query() query: ListUnitsQueryDto): Promise<PaginatedUnitsResponseDto> {
    return this.unitsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a unit by id' })
  @ApiOkResponse({ type: UnitResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Unit not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UnitResponseDto> {
    return this.unitsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a unit' })
  @ApiOkResponse({ type: UnitResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid values or empty update body',
  })
  @ApiNotFoundResponse({ description: 'Unit not found' })
  @ApiConflictResponse({ description: 'Unit code already exists' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnitDto,
  ): Promise<UnitResponseDto> {
    return this.unitsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate a unit (soft delete; sets isActive to false)',
  })
  @ApiOkResponse({ type: UnitResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Unit not found' })
  deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<UnitResponseDto> {
    return this.unitsService.deactivate(id);
  }
}
