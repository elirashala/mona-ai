import { Controller, Get, Query, StreamableFile } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';
import { reportCsv } from '../utils/report-csv';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get()
  report(@Query() query: Record<string, unknown>) {
    return this.service.report(query);
  }

  @Get('export')
  async download(@Query() query: Record<string, unknown>) {
    const report = await this.service.report(query);
    return new StreamableFile(Buffer.from(reportCsv(report), 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="report-${report.startDate}-${report.endDate}.csv"`,
    });
  }
}
