import { DateRangePicker } from '../components/DateRangePicker'
import { ReportPanel } from '../components/ReportPanel'
import type { DateRange } from '../types/report.types'

export function ReportsPage({
  range,
  onRangeChange,
}: {
  range: DateRange
  onRangeChange: (range: DateRange) => void
}) {
  return (
    <>
      <section className="panel" aria-label="Report date filters">
        <DateRangePicker range={range} onApply={onRangeChange} />
      </section>
      <ReportPanel range={range} />
    </>
  )
}
