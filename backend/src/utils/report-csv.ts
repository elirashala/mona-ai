import type { SiteReport } from '../types/report.types';

export function reportCsv(report: SiteReport): string {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const rows = report.rows.map((row) =>
    [
      report.startDate,
      report.endDate,
      row.site,
      String(row.requestCount),
      row.totalAmountChf,
    ]
      .map(escape)
      .join(';'),
  );
  // BOM preserves Swiss accents when opened in Excel; no floating-point amounts.
  return (
    '\uFEFFstart_date;end_date;site;request_count;total_chf\r\n' +
    rows.join('\r\n') +
    '\r\n'
  );
}
