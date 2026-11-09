const money = new Intl.NumberFormat('de-CH', {
  style: 'currency',
  currency: 'CHF',
  maximumFractionDigits: 2,
})
const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatChf(value: string) {
  const number = Number(value)
  // Keep very large values readable without silently losing integer precision.
  return Number.isFinite(number) && Math.abs(number) <= Number.MAX_SAFE_INTEGER
    ? money.format(number)
    : `${value} CHF`
}

export function formatTimestamp(value: string) {
  return dateTime.format(new Date(value))
}
