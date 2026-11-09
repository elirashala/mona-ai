import { Injectable } from '@nestjs/common';
import { SITES } from '../constants/import.constants';
import type { Prisma } from '../generated/prisma/client';
import { ReportsRepository } from '../repositories/reports.repository';
import type { SiteReport } from '../types/report.types';
import { reportRange } from '../utils/report-range';

function decimal(value: Prisma.Decimal | null): string {
  return value ? value.toFixed(Math.max(2, value.decimalPlaces())) : '0.00';
}

@Injectable()
export class ReportsService {
  constructor(private readonly repository: ReportsRepository) {}

  async report(query: Record<string, unknown>): Promise<SiteReport> {
    const range = reportRange(query);
    const { groups, summary } = await this.repository.report(range);
    return {
      ...range,
      rows: SITES.map((site) => {
        const group = groups.find((item) => item.site === site);
        return {
          site,
          requestCount: group?._count ?? 0,
          totalAmountChf: decimal(group?._sum.amountChf ?? null),
        };
      }),
      totalRequests: summary._count,
      totalAmountChf: decimal(summary._sum.amountChf),
    };
  }
}
