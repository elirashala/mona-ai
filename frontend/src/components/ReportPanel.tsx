import { useCallback, useState } from 'react'
import { downloadReport, getReport } from '../api/reports.api'
import type { DateRange } from '../types/report.types'
import { formatReportDate } from '../utils/date-ranges'
import { useResource } from '../hooks/useResource'
import { formatChf } from '../utils/format'
import { errorMessage } from '../utils/error-message'
import { ErrorNotice, Loading } from './Shared'

export function ReportPanel({ range }: { range: DateRange }) {
  const load = useCallback(
    (signal: AbortSignal) => getReport(range, signal),
    [range],
  )
  const { data, loading, error, reload } = useResource(load)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<{
    rangeKey: string
    message: string
  } | null>(null)
  const rangeKey = `${range.startDate}:${range.endDate}`
  const hasReport = Boolean(
    data &&
    data.startDate === range.startDate &&
    data.endDate === range.endDate &&
    data.totalRequests > 0,
  )

  async function download() {
    if (!hasReport || loading || downloading) return
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadReport(range)
    } catch (failure) {
      setDownloadError({ rangeKey, message: errorMessage(failure) })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section
      id="report"
      className="panel report-panel"
      aria-labelledby="report-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">02 / REPORT</p>
          <h2 id="report-title">Report by site</h2>
        </div>
        <div className="report-actions">
          {hasReport && !loading && (
            <button
              className="button primary"
              disabled={downloading}
              onClick={() => {
                void download()
              }}
            >
              {downloading ? 'Downloading…' : '↓ Download CSV'}
            </button>
          )}
        </div>
      </div>
      <p className="section-description">
        Requests reported from {formatReportDate(range.startDate)} to{' '}
        {formatReportDate(range.endDate)}. Invalid rows and duplicates are
        excluded.
      </p>
      <div className="report-content" aria-busy={loading}>
        {loading ? (
          <Loading label="Generating report…" />
        ) : error ? (
          <ErrorNotice message={error} retry={reload} />
        ) : hasReport && data ? (
          <>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Site report for selected dates"
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Site</th>
                    <th scope="col" className="amount">
                      Requests
                    </th>
                    <th scope="col" className="amount">
                      Total · CHF
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.site}>
                      <th scope="row">{row.site}</th>
                      <td className="amount">{row.requestCount}</td>
                      <td className="amount" title={row.totalAmountChf}>
                        {formatChf(row.totalAmountChf)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">All sites</th>
                    <td className="amount">{data.totalRequests}</td>
                    <td className="amount" title={data.totalAmountChf}>
                      {formatChf(data.totalAmountChf)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="helper">
              The CSV contains one row per site for the selected date range,
              with request count and total CHF.
            </p>
          </>
        ) : (
          <div className="state" role="status">
            <strong>No report for this period</strong>
            <span>No requests were reported in the selected date range.</span>
          </div>
        )}
      </div>
      {hasReport && downloadError?.rangeKey === rangeKey && (
        <ErrorNotice message={downloadError.message} />
      )}
    </section>
  )
}
