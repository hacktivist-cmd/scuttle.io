export const TIME_FILTERS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'This Year' },
  { value: 'ly', label: 'Last Year' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: 'all', label: 'All time' },
]

export function isInTimeRange(isoString, filterValue) {
  if (!isoString) return filterValue === 'all'
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return filterValue === 'all'

  const now = new Date()
  const year = date.getFullYear()
  const thisYear = now.getFullYear()

  switch (filterValue) {
    case '7d':
      return Date.now() - date.getTime() <= 7 * 24 * 60 * 60 * 1000
    case '30d':
      return Date.now() - date.getTime() <= 30 * 24 * 60 * 60 * 1000
    case '90d':
      return Date.now() - date.getTime() <= 90 * 24 * 60 * 60 * 1000
    case 'ytd':
      return year === thisYear
    case 'ly':
      return year === thisYear - 1
    case '2026':
      return year === 2026
    case '2025':
      return year === 2025
    case 'all':
    default:
      return true
  }
}
