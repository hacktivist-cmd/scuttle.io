/**
 * Friendly auth error messages.
 * Maps Firebase auth error codes to human-readable English.
 */

export const FRIENDLY_ERRORS = {
  // ── Credentials ──
  'auth/invalid-credential': 'The email or password you entered is incorrect. Please double-check and try again.',
  'auth/wrong-password': 'That password is incorrect. Try again or reset your password.',
  'auth/user-not-found': "We couldn't find an account with that email. Try signing up instead.",
  'auth/invalid-email': 'That email address looks invalid. Please check for typos.',
  'auth/invalid-password': 'Your password must be at least 6 characters long.',
  'auth/missing-password': 'Please enter your password.',

  // ── Account state ──
  'auth/user-disabled': 'This account has been suspended. Contact support if you think this is a mistake.',
  'auth/email-already-in-use': 'An account with that email already exists. Try signing in instead.',
  'auth/account-exists-with-different-credential': 'You already have an account with this email but signed up differently. Try Google or email instead.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled yet. Please use Google or email.',

  // ── Rate limiting / abuse ──
  'auth/too-many-requests': 'Too many failed attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Network error. Check your internet connection and try again.',

  // ── Verification ──
  'auth/user-mismatch': 'The credentials don\'t match the current user. Try signing out and back in.',
  'auth/requires-recent-login': 'For security, please sign in again before making this change.',

  // ── Popup / redirect flows ──
  'auth/popup-closed-by-user': 'Sign-in was cancelled. No worries — try again when ready.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups for this site.',
  'auth/cancelled-popup-request': 'Sign-in was interrupted. Try again.',
  'auth/redirect-cancelled-by-user': 'Sign-in was cancelled. Try again when ready.',

  // ── Provider-specific ──
  'auth/unauthorized-domain': 'This domain isn\'t authorized for sign-in. Contact support.',
  'auth/internal-error': 'Something went wrong on our end. Please try again in a moment.',
  'auth/web-storage-unsupported': 'Your browser is blocking cookies. Enable them to sign in.',

  // ── Password reset ──
  'auth/missing-email': 'Please enter your email address.',

  // ── Generic fallbacks ──
  'auth/operation-not-supported-in-this-environment': 'Sign-in isn\'t supported in this browser. Try Chrome or Safari.',
  'auth/invalid-verification-code': 'The verification code is incorrect. Please try again.',
  'auth/invalid-verification-id': 'The verification is invalid. Please request a new one.',
  'auth/code-expired': 'That code has expired. Please request a new one.',
};

/**
 * Convert a Firebase error to a friendly message.
 * Handles Firebase error codes, generic errors, and unknown errors gracefully.
 */
export function friendlyAuthError(err) {
  if (!err) return 'Something went wrong. Please try again.'

  // Extract code from various shapes
  const code = err.code || err.errorCode || ''

  // Exact match in our dictionary
  if (FRIENDLY_ERRORS[code]) return FRIENDLY_ERRORS[code]

  // If it's an auth/ code we don't recognize, clean it up
  if (code.startsWith('auth/')) {
    const cleaned = code
      .replace('auth/', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
    return `${cleaned}. Please try again.`
  }

  // Raw Firebase message — clean it
  let msg = (err.message || String(err)).replace('Firebase: ', '')

  // Strip the "(auth/xxx)" suffix
  msg = msg.replace(/\s*\(auth\/[^)]+\)\.?$/i, '').trim()

  if (msg && msg.length < 200) return msg + '.'

  return 'Something went wrong. Please try again.'
}

/** Optional: map a code directly */
export function friendlyErrorForCode(code) {
  return FRIENDLY_ERRORS[code] || 'Something went wrong. Please try again.'
}
