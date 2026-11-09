export interface DateRange {
  startDate: string
  endDate: string
}

export type DatePreset =
  'today' | 'yesterday' | 'last7Days' | 'lastWeek' | 'thisMonth' | 'lastMonth'

export interface SiteReport extends DateRange {
  rows: { site: string; requestCount: number; totalAmountChf: string }[]
  totalRequests: number
  totalAmountChf: string
}
