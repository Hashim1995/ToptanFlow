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
import { BusinessPartnersService } from './business-partners.service';
import { CreateBusinessPartnerDto } from './dto/create-business-partner.dto';
import { UpdateBusinessPartnerDto } from './dto/update-business-partner.dto';
import { ListBusinessPartnersQueryDto } from './dto/list-business-partners-query.dto';
import { PaginatedBusinessPartnersResponseDto } from './dto/paginated-business-partners-response.dto';
import { BusinessPartnerResponseDto } from './dto/business-partner-response.dto';

@ApiTags('Business Partners')
@Controller('business-partners')
export class BusinessPartnersController {
  constructor(
    private readonly businessPartnersService: BusinessPartnersService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a business partner',
    description:
      'Creates a unified counterparty. At least one of isCustomer or isSupplier must be true; both may be true. ' +
      'BusinessPartner.code is allocated by the backend (ADR-024); clients must not supply code. ' +
      'Code is immutable after creation — UpdateBusinessPartnerDto must not contain code. ' +
      'US-016: possible duplicates on normalized name/phone/taxNumber return 409 with candidates unless ' +
      'acknowledgeDuplicate is true. Soft flag only — uuid/code uniqueness is separate.',
  })
  @ApiBody({
    type: CreateBusinessPartnerDto,
    examples: {
      customerOnly: {
        value: {
          name: 'Nümunə MMC',
          isCustomer: true,
          isSupplier: false,
          defaultCurrencyId: '22222222-2222-4222-8222-222222222222',
          phone: '+994 50 123 45 67',
          email: 'info@example.com',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: BusinessPartnerResponseDto })
  @ApiBadRequestResponse({
    description:
      'Invalid field values, both roles false, empty name, inactive currency, or forbidden properties (e.g. code)',
  })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  @ApiConflictResponse({
    description:
      'Business partner code already exists, or possible duplicate partners found (US-016 soft flag; retry with acknowledgeDuplicate)',
  })
  create(
    @Body() dto: CreateBusinessPartnerDto,
  ): Promise<BusinessPartnerResponseDto> {
    return this.businessPartnersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List business partners with pagination, search, and filters',
  })
  @ApiOkResponse({ type: PaginatedBusinessPartnersResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  list(
    @Query() query: ListBusinessPartnersQueryDto,
  ): Promise<PaginatedBusinessPartnersResponseDto> {
    return this.businessPartnersService.list(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a business partner by id',
    description:
      'Returns the business partner whether active or inactive (for historical and administrative use).',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BusinessPartnerResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Business partner not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BusinessPartnerResponseDto> {
    return this.businessPartnersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a business partner (partial)',
    description:
      'Inactive partners may be updated for administrative correction. ' +
      'PATCH may set isActive true to reactivate, or false to deactivate. ' +
      'BusinessPartner.code is immutable and must not be sent (ADR-024). ' +
      'US-016: when name/phone/taxNumber change, possible duplicates return 409 unless acknowledgeDuplicate is true.',
  })
  @ApiBody({ type: UpdateBusinessPartnerDto })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BusinessPartnerResponseDto })
  @ApiBadRequestResponse({
    description:
      'Invalid UUID, empty update body, invalid field values, both roles false, inactive currency, or forbidden properties (e.g. code)',
  })
  @ApiNotFoundResponse({
    description: 'Business partner or currency not found',
  })
  @ApiConflictResponse({
    description:
      'Possible duplicate partners found after identity-helper field change (US-016; retry with acknowledgeDuplicate)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessPartnerDto,
  ): Promise<BusinessPartnerResponseDto> {
    return this.businessPartnersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate a business partner (soft delete)',
    description:
      'Sets isActive to false without physically deleting the record. ' +
      'Idempotent when the partner is already inactive. ' +
      'Business partner code remains reserved and historical relations stay intact.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BusinessPartnerResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid UUID' })
  @ApiNotFoundResponse({ description: 'Business partner not found' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BusinessPartnerResponseDto> {
    return this.businessPartnersService.deactivate(id);
  }
}
