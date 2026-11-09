import type { DateRange, SiteReport } from '../types/report.types'
import { request, send } from './client'

function query(range: DateRange) {
  return new URLSearchParams({
    startDate: range.startDate,
    endDate: range.endDate,
  })
}

export function getReport(range: DateRange, signal: AbortSignal) {
  return send<SiteReport>(`/api/reports?${query(range)}`, { signal })
}

export async function downloadReport(range: DateRange) {
  const response = await request(`/api/reports/export?${query(range)}`)
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = `report-${range.startDate}-${range.endDate}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
