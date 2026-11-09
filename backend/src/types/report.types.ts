export interface SiteReportRow {
  site: string;
  requestCount: number;
  totalAmountChf: string;
}

export interface ReportRange {
  startDate: string;
  endDate: string;
}

export interface SiteReport extends ReportRange {
  rows: SiteReportRow[];
  totalRequests: number;
  totalAmountChf: string;
}
