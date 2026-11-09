import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCsv } from '../src/utils/csv-parser';
import { evaluateRows } from '../src/utils/import-rules';
import { COLUMNS } from '../src/constants/import.constants';
import type { ParsedRow } from '../src/types/import.types';
import {
  parseAmount,
  parseSwissDate,
  validateRow,
} from '../src/utils/request-validation';

const header = COLUMNS.join(';');
const valid =
  "ALP-1;Zürich-Oerlikon;01.03.2026;Cleaning;clean;1'234.50;Someone";
const csv = (body: string) => Buffer.from(`${header}\r\n${body}`, 'utf8');
const row = (overrides: Record<string, string> = {}): ParsedRow => ({
  rowNumber: 2,
  errors: [],
  original: { ...parseCsv(csv(valid)).rows[0].original, ...overrides },
});

describe('CSV parsing', () => {
  it('treats a quoted empty field as a malformed row rather than a blank line', () => {
    const parsed = parseCsv(csv('""\n' + valid));
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].errors[0].code).toBe('COLUMN_COUNT');
  });
  it('reads UTF-8 and preserves escaped quotes, semicolons, and multiline descriptions', () => {
    const result = parseCsv(
      csv(
        valid.replace('clean', '"a; b ""quoted""\nnext line"') + '\r\n' + valid,
      ),
    );
    expect(result.encoding).toBe('utf-8');
    expect(result.rows[0].original.description).toBe(
      'a; b "quoted"\nnext line',
    );
    expect(result.rows.map((r) => r.rowNumber)).toEqual([2, 4]);
  });
  it('handles BOM, blank lines, and a last record without newline', () => {
    const result = parseCsv(
      Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), csv('\r\n' + valid)]),
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].rowNumber).toBe(3);
  });
  it('supports reordered headers and preserves extra named columns', () => {
    const values = valid.split(';');
    const result = parseCsv(
      Buffer.from(
        [...COLUMNS].reverse().join(';') +
          ';extra\n' +
          values.reverse().join(';') +
          ';kept',
      ),
    );
    expect(result.rows[0].original.request_id).toBe('ALP-1');
    expect(result.rows[0].original.extra).toBe('kept');
  });
  it.each([
    Buffer.alloc(0),
    Buffer.from(header),
    Buffer.from('wrong;header\na;b'),
    csv(''),
    csv(valid.replace('clean', '"unclosed')),
    Buffer.from('a\0b'),
  ])('rejects empty or malformed files', (input) => {
    expect(() => parseCsv(input)).toThrow();
  });
  it('rejects duplicate headers', () => {
    expect(() =>
      parseCsv(Buffer.from(header + ';site\n' + valid + ';x')),
    ).toThrow(/unique header/);
  });
  it('reports incorrect field counts as row errors, preserving extra values', () => {
    const result = parseCsv(
      csv(valid + ';extra\n' + valid.split(';').slice(0, 6).join(';')),
    );
    expect(result.rows.every((r) => r.errors[0].code === 'COLUMN_COUNT')).toBe(
      true,
    );
    expect(result.rows[0].original.__extra_fields).toBe('["extra"]');
  });
  it('enforces the row resource limit', () => {
    expect(() => parseCsv(csv(Array(10001).fill(valid).join('\n')))).toThrow(
      /10000/,
    );
  });
});

describe('calendar dates', () => {
  it.each(['29.02.2024', '29.02.2000', '31.12.2026', '01.01.0001'])(
    'accepts %s',
    (date) => {
      expect(parseSwissDate(date)).toBeInstanceOf(Date);
    },
  );
  it.each([
    '31.02.2026',
    '29.02.2026',
    '29.02.1900',
    '31.04.2026',
    '00.01.2026',
    '01.00.2026',
    '01.13.2026',
    '1.03.2026',
    '2026-03-01',
    '',
    '01.01.0000',
  ])('rejects %s', (date) => {
    expect(parseSwissDate(date)).toBeUndefined();
  });
});

describe('amounts', () => {
  it.each([
    ["1'234.50", '1234.50'],
    ['0.001', '0.001'],
    ['100', '100'],
    ["1'234'567.89", '1234567.89'],
  ])('parses %s exactly', (input, expected) => {
    expect(parseAmount(input)).toBe(expected);
  });
  it.each([
    '0',
    '0.00',
    '-1',
    'NaN',
    'Infinity',
    '1e3',
    "12'34.50",
    '1,50',
    '',
    ' 1.00 ',
    'CHF 1.00',
  ])('rejects %s', (amount) => {
    expect(parseAmount(amount)).toBeUndefined();
  });
});

describe('validation and duplicate policy', () => {
  it('returns all validation reasons', () => {
    const result = validateRow(
      row({
        site: 'Bern',
        category: 'Painting',
        reported_on: '31.02.2026',
        amount_chf: '-120',
      }),
    );
    expect(result.errors.map((e) => e.field)).toEqual([
      'site',
      'category',
      'reported_on',
      'amount_chf',
    ]);
    expect(result.request).toBeUndefined();
  });
  it('does not require description or technician or impose an ID pattern', () => {
    expect(
      validateRow(
        row({ request_id: 'other id', description: '', technician: '' }),
      ).errors,
    ).toEqual([]);
    expect(validateRow(row({ request_id: ' ' })).errors[0].code).toBe(
      'MISSING_ID',
    );
  });
  it('normalizes only identity and amount, preserving original values', () => {
    const original = row({ request_id: ' alp-1 ' });
    const result = validateRow(original).request!;
    expect(result.requestId).toBe('ALP-1');
    expect(result.original.request_id).toBe(' alp-1 ');
    expect(result.amountChf).toBe('1234.50');
  });
  it('first valid row wins, invalid rows do not reserve IDs, existing records are retained', () => {
    const rows = [
      row({ amount_chf: '0' }),
      row(),
      row({ request_id: ' alp-1 ' }),
      row({ request_id: 'ALP-2' }),
    ];
    expect(evaluateRows(rows, new Set(['ALP-2'])).map((r) => r.status)).toEqual(
      ['invalid', 'imported', 'duplicate', 'duplicate'],
    );
  });
});

describe('unaltered supplied CSV', () => {
  const fixture = readFileSync('sample-data/requests_2026-03.csv');
  it('decodes legacy accents and preserves multiline fields and row numbers', () => {
    const parsed = parseCsv(fixture);
    expect(parsed.encoding).toBe('windows-1252');
    expect(parsed.rows[1].original.site).toBe('Zürich-Oerlikon');
    expect(
      parsed.rows.find((r) => r.original.request_id === 'ALP-0083')?.original
        .description,
    ).toContain('\nRückfrage');
    expect(parsed.rows[5].rowNumber).toBe(8);
  });
  it('rejects the six invalid records, skips three identity variants, and assigns the actual reporting month', () => {
    const result = evaluateRows(parseCsv(fixture).rows, new Set());
    expect(result.filter((r) => r.status === 'invalid')).toHaveLength(6);
    expect(result.filter((r) => r.status === 'duplicate')).toHaveLength(3);
    expect(result.filter((r) => r.status === 'imported')).toHaveLength(112);
    const imported = result.filter((r) => r.status === 'imported');
    expect(
      imported.filter((r) => r.request!.reportedOn.getUTCMonth() === 2),
    ).toHaveLength(96);
    expect(
      evaluateRows(
        parseCsv(fixture).rows,
        new Set(imported.map((r) => r.request!.requestId)),
      ).filter((r) => r.status === 'imported'),
    ).toHaveLength(0);
  });
});
