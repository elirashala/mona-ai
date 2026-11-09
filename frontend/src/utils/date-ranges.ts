import type { DatePreset, DateRange } from '../types/report.types'

function localDate(year: number, month: number, day: number) {
  const value = new Date(0)
  value.setFullYear(year, month, day)
  value.setHours(12, 0, 0, 0)
  return value
}

function iso(value: Date) {
  return `${String(value.getFullYear()).padStart(4, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

export function presetRange(preset: DatePreset, now = new Date()): DateRange {
  const year = now.getFullYear(),
    month = now.getMonth(),
    day = now.getDate()
  let start = localDate(year, month, day)
  let end = localDate(year, month, day)
  if (preset === 'yesterday') {
    start.setDate(day - 1)
    end = new Date(start)
  }
  if (preset === 'last7Days') start.setDate(day - 6)
  if (preset === 'lastWeek') {
    const mondayOffset = (now.getDay() + 6) % 7
    start.setDate(day - mondayOffset - 7)
    end.setDate(day - mondayOffset - 1)
  }
  if (preset === 'thisMonth') start = localDate(year, month, 1)
  if (preset === 'lastMonth') {
    start = localDate(year, month - 1, 1)
    end = localDate(year, month, 0)
  }
  return { startDate: iso(start), endDate: iso(end) }
}

function isDate(value: string) {
  if (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = localDate(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function rangeError(range: DateRange): string | null {
  if (!isDate(range.startDate) || !isDate(range.endDate))
    return 'Choose a valid start and end date.'
  if (range.startDate > range.endDate)
    return 'The start date must be on or before the end date.'
  return null
}

export function formatReportDate(value: string) {
  return value.split('-').reverse().join('.')
}
