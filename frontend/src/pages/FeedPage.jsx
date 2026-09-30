import { useState, useMemo } from 'react'
import { SearchX, Loader2, Bell } from 'lucide-react'
import AnnouncementCard from '../components/AnnouncementCard'
import AnnouncementModal from '../components/AnnouncementModal'
import { useAnnouncements } from '../hooks/useAnnouncements'

export default function FeedPage({ category, title, subtitle, badge, badgeColor }) {
  const { announcements, status } = useAnnouncements()
  const [selectedItem, setSelectedItem] = useState(null)

  const filtered = useMemo(() => {
    const matches = announcements.filter((item) => item.category === category)
    const perUniversityCap = 3
    const counts = {}
    const result = []
    for (const item of matches) {
      const key = item.university_name
      counts[key] = (counts[key] || 0) + 1
      if (counts[key] <= perUniversityCap) result.push(item)
    }
    return result
  }, [announcements, category])

  const badgeClasses = {
    blue: 'bg-blue-50 text-apple-blue',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="max-w-6xl w-full mx-auto px-6 py-12">
      <div className="text-center mb-8 animate-hero-reveal">
        <span className={`inline-block text-xs font-semibold px-4 py-1.5 rounded-full tracking-wide uppercase mb-4 ${badgeClasses[badgeColor] || badgeClasses.blue}`}>
          {badge}
        </span>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">{title}</h1>
        <p className="text-apple-gray text-lg">{subtitle}</p>
      </div>

      {status === 'connecting' && announcements.length === 0 ? (
        <div className="py-20 text-center text-apple-gray flex flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="animate-spin text-apple-blue" />
          <p className="text-sm font-medium">Loading {title}...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[2rem] border border-gray-100 shadow-apple max-w-2xl mx-auto w-full">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-apple-blue" />
          </div>
          <p className="text-xl font-semibold mb-2">No {title} yet</p>
          <p className="text-sm text-apple-gray">We'll notify you the moment something drops.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item, index) => (
            <AnnouncementCard key={item.id} item={item} index={index} onClick={() => setSelectedItem(item)} />
          ))}
        </div>
      )}

      <AnnouncementModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  )
}
