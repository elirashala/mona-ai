import { useEffect, useRef, useState } from 'react'
import type { ImportResult, RowStatus } from '../types/import.types'
import { formatTimestamp } from '../utils/format'
import { Pagination, StatusBadge } from './Shared'

export function ImportResults({ result }: { result: ImportResult }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  const [status, setStatus] = useState<RowStatus | 'all'>(
    result.invalidCount
      ? 'invalid'
      : result.duplicateCount
        ? 'duplicate'
        : 'all',
  )
  const [skip, setSkip] = useState(0)
  const rows = result.rows.filter(
    (row) => status === 'all' || row.status === status,
  )
  const counts = [
    { label: 'Total rows', count: result.totalRows, className: 'total' },
    { label: 'Imported', count: result.importedCount, className: 'imported' },
    { label: 'Invalid', count: result.invalidCount, className: 'invalid' },
    {
      label: 'Duplicates',
      count: result.duplicateCount,
      className: 'duplicate',
    },
  ]
  const tabs: { value: RowStatus | 'all'; label: string; count: number }[] = [
    { value: 'all', label: 'All rows', count: result.totalRows },
    { value: 'invalid', label: 'Invalid', count: result.invalidCount },
    { value: 'duplicate', label: 'Duplicates', count: result.duplicateCount },
    { value: 'imported', label: 'Imported', count: result.importedCount },
  ]

  return (
    <section className="panel results-panel" aria-labelledby="result-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">IMPORT RESULTS</p>
          <h2 id="result-title" ref={heading} tabIndex={-1}>
            Every row, accounted for.
          </h2>
        </div>
        <span className="badge complete">✓ Processed</span>
      </div>
      <p className="file-metadata">
        <strong>{result.filename}</strong>
        <span>
          {formatTimestamp(result.createdAt)} · {result.encoding}
        </span>
      </p>
      <div className="stat-grid" aria-label="Import summary">
        {counts.map((item) => (
          <div className={`stat ${item.className}`} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.count.toLocaleString()}</strong>
          </div>
        ))}
      </div>
      {result.invalidCount > 0 && (
        <p className="notice warning">
          {result.invalidCount}{' '}
          {result.invalidCount === 1 ? 'row needs' : 'rows need'} attention. Fix
          the original values in your source system and upload again.
        </p>
      )}
      <div
        className="outcome-tabs"
        role="group"
        aria-label="Filter row outcomes"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            aria-pressed={status === tab.value}
            onClick={() => {
              setStatus(tab.value)
              setSkip(0)
            }}
          >
            {tab.label}
            <span>{tab.count}</span>
          </button>
        ))}
      </div>
      <p className="helper">
        Row numbers refer to physical lines in the uploaded CSV. Duplicate rows
        keep the existing request unchanged.
      </p>
      {rows.length ? (
        <>
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Import row outcomes"
          >
            <table className="results-table">
              <thead>
                <tr>
                  <th scope="col">CSV row</th>
                  <th scope="col">Request ID</th>
                  <th scope="col">Outcome</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(skip, skip + 20).map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{row.rowNumber}</td>
                    <td className="mono">
                      {row.original.request_id || row.requestId || 'Missing ID'}
                    </td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>
                      {row.errors.length ? (
                        <ul className="error-list">
                          {row.errors.map((error, index) => (
                            <li key={`${error.field}-${index}`}>
                              <strong>{error.field}:</strong> {error.message}
                              {Object.hasOwn(row.original, error.field) && (
                                <span className="original-value">
                                  Original value:{' '}
                                  {row.original[error.field] ? (
                                    <q>{row.original[error.field]}</q>
                                  ) : (
                                    '(empty)'
                                  )}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="muted">
                          Validated and added to processed requests.
                        </span>
                      )}
                      <details className="original-details">
                        <summary>View original values</summary>
                        <dl>
                          {Object.entries(row.original).map(([key, value]) => (
                            <div key={key}>
                              <dt>{key}</dt>
                              <dd>{value || '(empty)'}</dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            total={rows.length}
            take={20}
            skip={skip}
            onChange={setSkip}
            label="rows"
          />
        </>
      ) : (
        <div className="state">
          No {status === 'all' ? '' : status} rows in this import.
        </div>
      )}
    </section>
  )
}
