import {
  Body,
  Controller,
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
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import {
  CreateExpenseCategoryDto,
  DeactivateExpenseCategoryDto,
  ExpenseCategoryResponseDto,
  UpdateExpenseCategoryDto,
} from './dto/expense-category.dto';
import { ListExpenseCategoriesQueryDto } from './dto/list-expense-categories-query.dto';
import { ExpenseCategoriesService } from './expense-categories.service';

@ApiTags('Expense Categories')
@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(
    private readonly expenseCategoriesService: ExpenseCategoriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create expense category' })
  @ApiCreatedResponse({ type: ExpenseCategoryResponseDto })
  @ApiConflictResponse()
  create(
    @Body() dto: CreateExpenseCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List expense categories' })
  list(@Query() query: ListExpenseCategoriesQueryDto) {
    return this.expenseCategoriesService.list(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: ExpenseCategoryResponseDto })
  @ApiNotFoundResponse()
  getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.getById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ExpenseCategoryResponseDto })
  @ApiBadRequestResponse()
  @ApiConflictResponse()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.update(id, dto);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate expense category' })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeactivateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.deactivate(id, dto);
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate expense category' })
  reactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.reactivate(id);
  }
}
