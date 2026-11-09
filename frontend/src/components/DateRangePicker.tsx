import { useState } from 'react'
import type { DatePreset, DateRange } from '../types/report.types'
import { presetRange, rangeError } from '../utils/date-ranges'

const presets: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7Days', label: 'Last 7 days' },
  { value: 'lastWeek', label: 'Last week' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
]

export function DateRangePicker({
  range,
  onApply,
}: {
  range: DateRange
  onApply: (range: DateRange) => void
}) {
  const [draft, setDraft] = useState(range)
  const error = rangeError(draft)
  return (
    <div className="range-picker">
      <aside className="date-shortcuts" aria-label="Quick date ranges">
        {presets.map((preset) => {
          const value = presetRange(preset.value)
          return (
            <button
              key={preset.value}
              type="button"
              aria-pressed={
                range.startDate === value.startDate &&
                range.endDate === value.endDate
              }
              onClick={() => {
                setDraft(value)
                onApply(value)
              }}
            >
              {preset.label}
            </button>
          )
        })}
      </aside>
      <form
        className="custom-range"
        onSubmit={(event) => {
          event.preventDefault()
          if (!error) onApply(draft)
        }}
      >
        <h3>Choose a date range</h3>
        <p className="helper">
          Both dates are included. Last week means the previous Monday–Sunday.
        </p>
        <div className="date-inputs">
          <label>
            From
            <input
              type="date"
              value={draft.startDate}
              min="0001-01-01"
              max="9999-12-31"
              required
              aria-describedby={error ? 'range-error' : undefined}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  startDate: event.target.value,
                }))
              }
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={draft.endDate}
              min="0001-01-01"
              max="9999-12-31"
              required
              aria-describedby={error ? 'range-error' : undefined}
              onChange={(event) =>
                setDraft((previous) => ({
                  ...previous,
                  endDate: event.target.value,
                }))
              }
            />
          </label>
        </div>
        {error && (
          <p id="range-error" className="range-error" role="status">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="button primary small"
          disabled={Boolean(error)}
        >
          Apply dates
        </button>
      </form>
    </div>
  )
}
