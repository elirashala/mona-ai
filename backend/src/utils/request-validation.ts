import { CATEGORIES, SITES } from '../constants/import.constants';
import type { ParsedRow, RowError, ValidRequest } from '../types/import.types';

export function parseSwissDate(value: string): Date | undefined {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  if (!match) return undefined;
  const [, day, month, year] = match.map(Number);
  if (year < 1) return undefined;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : undefined;
}

export function parseAmount(value: string): string | undefined {
  // Accept ungrouped decimal CHF or correctly grouped Swiss apostrophes.
  if (!/^(?:\d+|\d{1,3}(?:'\d{3})+)(?:\.\d+)?$/.test(value)) return undefined;
  const amount = value.replaceAll("'", '');
  if (!/[1-9]/.test(amount)) return undefined;
  return amount;
}

export function validateRow(row: ParsedRow): {
  errors: RowError[];
  request?: ValidRequest;
} {
  const raw = row.original;
  const errors = [...row.errors];
  const add = (field: string, code: string, message: string) =>
    errors.push({ field, code, message });
  const requestId = raw.request_id.trim().toUpperCase();
  if (!requestId)
    add(
      'request_id',
      'MISSING_ID',
      'Request ID is needed to identify and count a request once.',
    );
  if (!SITES.includes(raw.site))
    add('site', 'UNKNOWN_SITE', 'Site must be one of the sites in spec.md.');
  if (!CATEGORIES.includes(raw.category))
    add(
      'category',
      'UNKNOWN_CATEGORY',
      'Category must be one of the categories in spec.md.',
    );
  const reportedOn = parseSwissDate(raw.reported_on);
  if (!reportedOn)
    add(
      'reported_on',
      'INVALID_DATE',
      'Expected a real calendar date in DD.MM.YYYY format.',
    );
  const amountChf = parseAmount(raw.amount_chf);
  if (!amountChf)
    add(
      'amount_chf',
      'INVALID_AMOUNT',
      "Expected a decimal CHF amount greater than zero (e.g. 1234.50 or 1'234.50).",
    );
  if (errors.length || !reportedOn || !amountChf) return { errors };
  return {
    errors,
    request: {
      requestId,
      site: raw.site,
      reportedOn,
      category: raw.category,
      description: raw.description,
      amountChf,
      technician: raw.technician,
      original: raw,
    },
  };
}
