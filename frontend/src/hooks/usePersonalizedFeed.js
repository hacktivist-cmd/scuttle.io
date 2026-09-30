import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function usePersonalizedFeed(announcements, options = {}) {
  const { profile } = useAuth()
  const { enabled = true } = options

  const interests = profile?.interests || []
  const followedUniversities = profile?.followedUniversities || []
  const hasPreferences = interests.length > 0 || followedUniversities.length > 0

  const { forYou, scoreMap } = useMemo(() => {
    const now = Date.now()
    const scoreMap = new Map()

    const scored = announcements.map((item) => {
      let score = 0
      const reasons = []

      const uniCodeMatch = (item.university_code || '').toUpperCase()
      const uniNameMatch = (item.university_name || '').toUpperCase()
      const followsUni = followedUniversities.some((code) => {
        const c = code.toUpperCase()
        return uniCodeMatch === c || uniNameMatch.includes(c)
      })
      if (followsUni) {
        score += 100
        reasons.push('university')
      }

      if (interests.includes(item.category)) {
        score += 50
        reasons.push('category')
      }

      const ageHours = (now - new Date(item.date_scraped).getTime()) / (1000 * 60 * 60)
      if (ageHours < 24) {
        score += 20
        reasons.push('fresh')
      } else if (ageHours < 24 * 7) {
        score += 10
      }

      scoreMap.set(item.id, { score, reasons })
      return { item, score }
    })

    if (!hasPreferences || !enabled) {
      return {
        forYou: [...announcements].sort(
          (a, b) => new Date(b.date_scraped) - new Date(a.date_scraped)
        ),
        scoreMap,
      }
    }

    const ranked = scored
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return new Date(b.item.date_scraped) - new Date(a.item.date_scraped)
      })
      .map(({ item }) => item)

    return { forYou: ranked, scoreMap }
  }, [announcements, interests, followedUniversities, hasPreferences, enabled])

  return {
    forYou,
    scoreMap,
    hasPreferences,
    matchCount: Array.from(scoreMap.values()).filter((v) => v.score > 0).length,
  }
}
