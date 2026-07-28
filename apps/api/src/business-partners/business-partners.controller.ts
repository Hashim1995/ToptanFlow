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
      'Step 16.3 (not in this task): UpdateBusinessPartnerDto must not contain code — code is immutable.',
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
  @ApiConflictResponse({ description: 'Business partner code already exists' })
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
}
