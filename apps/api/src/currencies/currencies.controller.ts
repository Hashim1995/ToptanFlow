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
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { CurrencyResponseDto } from './dto/currency-response.dto';
import { ListCurrenciesQueryDto } from './dto/list-currencies-query.dto';
import { PaginatedCurrenciesResponseDto } from './dto/paginated-currencies-response.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { CurrenciesService } from './currencies.service';

@ApiTags('Currencies')
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a currency' })
  @ApiCreatedResponse({ type: CurrencyResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid or empty field values' })
  @ApiConflictResponse({ description: 'Currency code already exists' })
  create(@Body() dto: CreateCurrencyDto): Promise<CurrencyResponseDto> {
    return this.currenciesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List currencies with pagination and filters' })
  @ApiOkResponse({ type: PaginatedCurrenciesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  list(
    @Query() query: ListCurrenciesQueryDto,
  ): Promise<PaginatedCurrenciesResponseDto> {
    return this.currenciesService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a currency by id' })
  @ApiOkResponse({ type: CurrencyResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CurrencyResponseDto> {
    return this.currenciesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a currency' })
  @ApiOkResponse({ type: CurrencyResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid values or empty update body',
  })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  @ApiConflictResponse({ description: 'Currency code already exists' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCurrencyDto,
  ): Promise<CurrencyResponseDto> {
    return this.currenciesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate a currency (soft delete; sets isActive to false)',
  })
  @ApiOkResponse({ type: CurrencyResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CurrencyResponseDto> {
    return this.currenciesService.deactivate(id);
  }
}
