import { universitiesData } from '../data/universities'

/**
 * Match an announcement to its university in `universitiesData` using
 * multiple strategies (code, exact name, name-includes-code, first-word).
 */
export function matchUniversity(item) {
  if (!item) return null

  // 1. Exact code match
  if (item.university_code) {
    const byCode = universitiesData.find((u) => u.code === item.university_code)
    if (byCode) return byCode
  }

  const nameUpper = (item.university_name || '').toUpperCase()
  if (!nameUpper) return null

  // 2. Code appears in the name (case-insensitive)
  for (const u of universitiesData) {
    if (nameUpper.includes(u.code.toUpperCase())) return u
  }

  // 3. Full name match (case-insensitive)
  for (const u of universitiesData) {
    if (u.name.toUpperCase() === nameUpper) return u
  }

  // 4. First significant word match (helps with short names like "Babcock")
  for (const u of universitiesData) {
    const firstWord = u.name.split(' ')[0].toUpperCase()
    if (firstWord.length >= 4 && nameUpper.startsWith(firstWord)) return u
  }

  return null
}
