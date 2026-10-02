/**
 * Share helpers — uses native share sheet on mobile, clipboard fallback on desktop.
 */

export const APP_URL = 'https://scuttle-io.netlify.app'
export const APP_TAGLINE = 'Live Nigerian university updates — Post-UTME, admission lists, JAMB CAPS alerts.'
export const APP_HASHTAGS = ['ScuttleIO', 'NigerianStudents', 'JAMB', 'PostUTME', 'Admissions']

/** Check if native share is available (mobile, some desktop browsers) */
export function canNativeShare() {
  if (typeof navigator === 'undefined') return false
  return typeof navigator.share === 'function'
}

/**
 * Trigger native share sheet if available, else copy to clipboard.
 * Returns: 'shared' | 'copied' | 'failed'
 */
export async function shareApp({ title = 'Scuttle.io', text = APP_TAGLINE } = {}) {
  const url = APP_URL

  // 1. Native share sheet (mobile + some desktop)
  if (canNativeShare()) {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      // User cancelled — don't fall through to copy
      if (err.name === 'AbortError') return 'shared'
      // Otherwise fall through to clipboard
    }
  }

  // 2. Clipboard fallback
  try {
    await navigator.clipboard.writeText(`${text}\n\n${url}`)
    return 'copied'
  } catch (err) {
    console.warn('Share failed:', err)
    return 'failed'
  }
}

/** Share links for specific platforms */
export function whatsappShareUrl(text = APP_TAGLINE) {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${APP_URL}`)}`
}

export function twitterShareUrl(text = APP_TAGLINE) {
  const hashtags = APP_HASHTAGS.join(',')
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(APP_URL)}&hashtags=${hashtags}`
}

export function telegramShareUrl(text = APP_TAGLINE) {
  return `https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(text)}`
}

export function facebookShareUrl() {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_URL)}`
}

export function linkedinShareUrl() {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(APP_URL)}`
}
