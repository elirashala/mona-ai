import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import type { ReportRange } from '../types/report.types';
import { parseIsoDate } from '../utils/report-range';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async report(range: ReportRange) {
    const endExclusive = parseIsoDate(range.endDate)!;
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    const where = {
      reportedOn: {
        gte: parseIsoDate(range.startDate)!,
        lt: endExclusive,
      },
    };
    const [groups, summary] = await this.prisma.$transaction(
      [
        this.prisma.request.groupBy({
          by: ['site'],
          where,
          _count: true,
          _sum: { amountChf: true },
        }),
        this.prisma.request.aggregate({
          where,
          _count: true,
          _sum: { amountChf: true },
        }),
      ],
      { isolationLevel: 'RepeatableRead' },
    );
    return { groups, summary };
  }
}
