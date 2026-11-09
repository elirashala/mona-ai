import type { RowStatus } from '../types/import.types'

export function ErrorNotice({
  message,
  retry,
}: {
  message: string
  retry?: () => void
}) {
  return (
    <div className="notice error" role="alert">
      <span>{message}</span>
      {retry && (
        <button className="text-button" onClick={retry}>
          Try again ↻
        </button>
      )}
    </div>
  )
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state" role="status">
      <span className="spinner" />
      {label}
    </div>
  )
}

export function StatusBadge({ status }: { status: RowStatus }) {
  return (
    <span className={`badge ${status}`}>
      <span aria-hidden="true">
        {status === 'imported' ? '✓' : status === 'invalid' ? '!' : '↳'}
      </span>
      {status === 'imported'
        ? 'Imported'
        : status === 'invalid'
          ? 'Invalid'
          : 'Duplicate'}
    </span>
  )
}

export function Pagination({
  total,
  take,
  skip,
  onChange,
  disabled = false,
  label,
}: {
  total: number
  take: number
  skip: number
  onChange: (skip: number) => void
  disabled?: boolean
  label: string
}) {
  return (
    <nav className="pagination" aria-label={label}>
      <span>
        {total && skip < total
          ? `${skip + 1}–${Math.min(skip + take, total)} of ${total.toLocaleString()} ${label}`
          : `0 of ${total.toLocaleString()} ${label}`}
      </span>
      <div>
        <button
          className="button secondary small"
          aria-label={`Previous page of ${label}`}
          disabled={disabled || skip === 0}
          onClick={() => onChange(Math.max(0, skip - take))}
        >
          ← Previous
        </button>
        <button
          className="button secondary small"
          aria-label={`Next page of ${label}`}
          disabled={disabled || skip + take >= total}
          onClick={() => onChange(skip + take)}
        >
          Next →
        </button>
      </div>
    </nav>
  )
}
