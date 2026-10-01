import { useEffect } from 'react'
import { resetBadge } from '../lib/badge'

/**
 * Clears the app icon badge when the user opens the app.
 * Same behavior as WhatsApp/iOS Mail — badge means "you have unread items".
 */
export function useBadgeReset() {
  useEffect(() => {
    // Clear badge when app comes into focus
    resetBadge()

    // Also clear when app returns to focus (user was on another tab/app)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') resetBadge()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])
}
