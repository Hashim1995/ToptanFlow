import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { DailyBalanceReportService } from './daily-balance-report.service';
import {
  DailyBalanceExportQueryDto,
  DailyBalanceReportResponseDto,
} from './dto/daily-balance-report.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly dailyBalanceReportService: DailyBalanceReportService,
  ) {}

  @Get('daily-balance/export')
  @ApiOperation({
    summary: 'Generate a transient daily balance snapshot Excel download',
    description:
      'Returns an in-memory XLSX response. No file, archive, background job, or storage record is created.',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportDailyBalance(
    @Query() query: DailyBalanceExportQueryDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    void query;
    const abortController = new AbortController();
    request.once('aborted', () => abortController.abort());
    const report = await this.dailyBalanceReportService.getReport(
      abortController.signal,
    );
    const buffer = await this.dailyBalanceReportService.createExcel(
      report,
      abortController.signal,
    );
    abortController.signal.throwIfAborted();

    const stamp = report.generatedAt.toISOString().slice(0, 10);
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="gunluk-report-${stamp}.xlsx"`,
    );
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Length', buffer.length);
    response.send(buffer);
  }

  @Get('daily-balance')
  @ApiOperation({
    summary: 'Get live daily balance snapshot for browser print',
    description:
      'All Business Partners (including inactive) with signed debt balances; active Cash Accounts only; company cash total. Intentionally unpaginated.',
  })
  @ApiOkResponse({ type: DailyBalanceReportResponseDto })
  getDailyBalance(
    @Req() request: Request,
  ): Promise<DailyBalanceReportResponseDto> {
    const abortController = new AbortController();
    request.once('aborted', () => abortController.abort());
    return this.dailyBalanceReportService.getReport(abortController.signal);
  }
}
