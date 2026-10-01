/**
 * Format a date for display in the UI.
 * Returns relative time for recent items, full date for old ones.
 */
export function timeAgo(isoString) {
  if (!isoString) return 'unknown'
  try {
    const date = new Date(isoString)
    const now = Date.now()
    const diff = Math.floor((now - date.getTime()) / 1000) // seconds

    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return 'unknown'
  }
}

/** Full date + time for modals */
export function fullDateTime(isoString) {
  if (!isoString) return 'unknown'
  try {
    return new Date(isoString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'unknown'
  }
}
