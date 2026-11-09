import { BadRequestException } from '@nestjs/common';
import type { ReportRange } from '../types/report.types';

export function parseIsoDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value))
    return undefined;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : undefined;
}

export function previousMonth(now = new Date()): ReportRange {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Belgrade',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')!.value);
  const month = Number(parts.find((part) => part.type === 'month')!.value);
  const start = new Date(Date.UTC(year, month - 2, 1));
  const end = new Date(Date.UTC(year, month - 1, 0));
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function reportRange(
  query: Record<string, unknown>,
  now = new Date(),
): ReportRange {
  if (query.startDate === undefined && query.endDate === undefined)
    return previousMonth(now);
  const start = parseIsoDate(query.startDate);
  const end = parseIsoDate(query.endDate);
  if (!start || !end)
    throw new BadRequestException(
      'Provide startDate and endDate as real calendar dates in YYYY-MM-DD format.',
    );
  if (start > end)
    throw new BadRequestException('startDate must be on or before endDate.');
  return {
    startDate: query.startDate as string,
    endDate: query.endDate as string,
  };
}
