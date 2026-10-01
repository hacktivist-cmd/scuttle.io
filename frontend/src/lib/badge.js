/**
 * App icon badge helpers — shows red dot with count on home screen icon.
 * Uses the Badging API (Chrome/Edge/Safari-installed).
 */

export function isBadgeSupported() {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator
}

/** Set the badge count */
export async function setBadgeCount(count) {
  if (!isBadgeSupported()) return
  try {
    if (count > 0) {
      await navigator.setAppBadge(count)
    } else {
      await navigator.clearAppBadge()
    }
  } catch (err) {
    console.warn('Badge set failed:', err.message)
  }
}

/** Clear the badge */
export async function clearBadge() {
  if (!isBadgeSupported()) return
  try {
    await navigator.clearAppBadge()
  } catch (err) {
    console.warn('Badge clear failed:', err.message)
  }
}

/** Increment the badge from current stored value */
export async function incrementBadge() {
  if (!isBadgeSupported()) return
  try {
    const current = parseInt(localStorage.getItem('scuttle_badge_count') || '0', 10)
    const next = current + 1
    localStorage.setItem('scuttle_badge_count', String(next))
    await navigator.setAppBadge(next)
  } catch (err) {
    console.warn('Badge increment failed:', err.message)
  }
}

/** Reset badge (when user opens the app) */
export async function resetBadge() {
  if (!isBadgeSupported()) return
  try {
    localStorage.setItem('scuttle_badge_count', '0')
    await navigator.clearAppBadge()
  } catch (err) {
    console.warn('Badge reset failed:', err.message)
  }
}
