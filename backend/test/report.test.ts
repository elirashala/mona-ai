import { describe, expect, it } from 'vitest';
import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';
import { SITES } from '../src/constants/import.constants';
import { parseCsv } from '../src/utils/csv-parser';
import { evaluateRows } from '../src/utils/import-rules';
import { reportCsv } from '../src/utils/report-csv';
import type { SiteReport } from '../src/types/report.types';

describe('client control figures from the unchanged fixture', () => {
  const valid = evaluateRows(
    parseCsv(readFileSync('sample-data/requests_2026-03.csv')).rows,
    new Set(),
  )
    .filter((row) => row.status === 'imported')
    .map((row) => row.request!);
  it.each([
    ['Zürich-Oerlikon', 31, 4837590n],
    ['Genève-Plainpalais', 19, 3588990n],
    ['Basel-St. Johann', 26, 3320985n],
    ['Lugano-Centro', 20, 3018365n],
  ])('reports March totals for %s', (site, count, cents) => {
    const rows = valid.filter(
      (row) =>
        row.site === site &&
        row.reportedOn >= new Date('2026-03-01') &&
        row.reportedOn < new Date('2026-04-01'),
    );
    expect(rows).toHaveLength(count);
    expect(
      rows.reduce(
        (total, row) => total + BigInt(row.amountChf.replace('.', '')),
        0n,
      ),
    ).toBe(cents);
  });
});

describe('report CSV export', () => {
  it('exports four sites with BOM, CRLF, and exact decimal strings, including zero sites', () => {
    const report: SiteReport = {
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      totalRequests: 1,
      totalAmountChf: '1234.50',
      rows: SITES.map((site, i) => ({
        site,
        requestCount: i === 0 ? 1 : 0,
        totalAmountChf: i === 0 ? '1234.50' : '0.00',
      })),
    };
    const csv = reportCsv(report);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv.endsWith('\r\n')).toBe(true);
    const rows = parse(csv, { columns: true, delimiter: ';', bom: true });
    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual({
      start_date: '2026-03-01',
      end_date: '2026-03-31',
      site: 'Zürich-Oerlikon',
      request_count: '1',
      total_chf: '1234.50',
    });
    expect(rows[3].total_chf).toBe('0.00');
  });
  it('escapes semicolons, quotes and newlines without changing values', () => {
    const site = 'a; "quoted"\nsite';
    const csv = reportCsv({
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      totalRequests: 0,
      totalAmountChf: '0.00',
      rows: [{ site, requestCount: 0, totalAmountChf: '0.00' }],
    });
    expect(
      parse(csv, { columns: true, delimiter: ';', bom: true })[0].site,
    ).toBe(site);
  });
});
