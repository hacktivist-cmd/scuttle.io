import { useState } from 'react'

/**
 * University logo with smart fallback chain.
 * Skips Clearbit for .edu.ng (they never have Nigerian uni logos) and
 * jumps straight to Google favicons → direct favicon → letter avatar.
 */
export default function UniversityLogo({
  university,
  size = 40,
  rounded = 'rounded-xl',
  className = '',
}) {
  const [tier, setTier] = useState(0)

  const domain = (() => {
    try {
      const url = university?.url || university?.base_url || ''
      if (!url) return ''
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return ''
    }
  })()

  const letter = (
    university?.code ||
    university?.short_code ||
    university?.name ||
    'U'
  )
    .charAt(0)
    .toUpperCase()

  // Skip Clearbit for .edu.ng — they never have these
  const skipClearbit = domain.endsWith('.edu.ng') || domain.endsWith('.edu')

  const SOURCES = domain
    ? [
        ...(skipClearbit ? [] : [`https://logo.clearbit.com/${domain}`]),
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        `https://${domain}/favicon.ico`,
      ]
    : []

  const src = SOURCES[tier]

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-apple-bg text-apple-dark font-bold border border-gray-200 ${rounded} ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.42 }}
      >
        {letter}
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center bg-white border border-gray-200/70 overflow-hidden ${rounded} ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={`${university?.name || 'University'} logo`}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setTier((t) => t + 1)}
        className="w-full h-full object-contain p-0.5"
      />
    </div>
  )
}
