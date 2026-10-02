import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAnnouncements } from '../hooks/useAnnouncements'
import UniversityLogo from './UniversityLogo'
import { matchUniversity } from '../lib/matchUniversity'
import { timeAgo } from '../lib/timeAgo'

/**
 * UniMarquee — scrolling strip of the 5 most recent updates
 * from 5 different universities. Duplicated for seamless loop.
 */
export default function UniMarquee() {
  const { announcements, status } = useAnnouncements()
  const navigate = useNavigate()

  // Pick 5 most recent announcements — one per unique university
  const items = useMemo(() => {
    const seen = new Set()
    const picks = []
    for (const a of announcements) {
      const key = a.university_code || a.university_name
      if (seen.has(key)) continue
      seen.add(key)
      picks.push(a)
      if (picks.length >= 5) break
    }
    return picks
  }, [announcements])

  if (status !== 'live' || items.length === 0) return null

  // Duplicate for seamless infinite loop
  const looped = [...items, ...items, ...items, ...items]

  const handleClick = (item) => {
    navigate('/', { state: { searchTerm: item.university_name } })
  }

  return (
    <div className="relative overflow-hidden bg-white border border-gray-100 rounded-2xl py-3 shadow-apple">
      {/* Live indicator badge */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 bg-white pl-2 pr-4 py-1 rounded-full shadow-sm border border-gray-100">
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-green-500 opacity-75 animate-ping-dot" />
          <span className="relative rounded-full w-1.5 h-1.5 bg-green-500" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-apple-dark">
          Live
        </span>
      </div>

      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white via-white to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none" />

      <div className="flex animate-marquee gap-10 w-max pl-32">
        {looped.map((item, i) => {
          const uni = matchUniversity(item) || {
            name: item.university_name,
            code: item.university_code || 'UNI',
          }
          return (
            <button
              key={`${item.id}-${i}`}
              onClick={() => handleClick(item)}
              className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity group"
            >
              <UniversityLogo university={uni} size={26} rounded="rounded-lg" />
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-[11px] font-bold text-apple-dark tracking-tight">
                  {item.university_code || item.university_name.split(' ')[0]}
                </span>
                <span className="w-px h-3 bg-gray-200" />
                <span className="text-[11px] text-apple-gray max-w-[340px] truncate group-hover:text-apple-blue transition-colors">
                  {item.title}
                </span>
                <span className="text-[10px] text-apple-gray/70 font-medium">
                  {timeAgo(item.date_scraped)}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
