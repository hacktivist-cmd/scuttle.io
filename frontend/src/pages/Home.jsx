import { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SearchX, Loader2, Bell, Star, Clock, Filter } from 'lucide-react'
import Hero from '../components/Hero'
import UniMarquee from '../components/UniMarquee'
import Filters from '../components/Filters'
import AnnouncementCard from '../components/AnnouncementCard'
import AnnouncementModal from '../components/AnnouncementModal'
import AuthGateModal from '../components/AuthGateModal'
import FeedToggle from '../components/FeedToggle'
import RevealWrapper from '../components/RevealWrapper'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { useReadTracking } from '../hooks/useReadTracking'
import { useAuthGate } from '../hooks/useAuthGate'
import { usePersonalizedFeed } from '../hooks/usePersonalizedFeed'
import { useSEO } from '../hooks/useSEO'
import { useAuth } from '../contexts/AuthContext'
import { TIME_FILTERS, isInTimeRange } from '../lib/timeFilters'

const PAGE_SIZE = 9
const HIGH_PRIORITY = ['Post-UTME', 'Admission List', 'JAMB CAPS']

export default function Home() {
  const location = useLocation()
  const { user } = useAuth()
  const { announcements, status } = useAnnouncements()
  const { count: readCount, clearAll } = useReadTracking()
  const { gateOpen, closeGate, requireAuth, reason } = useAuthGate()

  const [feedMode, setFeedMode] = useState('personalized')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [timeFilter, setTimeFilter] = useState('30d')
  const [selectedItem, setSelectedItem] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useSEO({
    title: 'Home',
    description: 'Real-time Nigerian university updates — Post-UTME, admission lists, and JAMB CAPS alerts from 200+ Federal, State, and Private institutions.',
    canonical: 'https://scuttle.io/',
  })

  useEffect(() => {
    if (location.state?.searchTerm) {
      setSearch(location.state.searchTerm)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search, typeFilter, categoryFilter, timeFilter, feedMode])

  const timeFiltered = useMemo(() => {
    return announcements.filter((a) => isInTimeRange(a.date_published || a.date_scraped, timeFilter))
  }, [announcements, timeFilter])

  const { forYou, scoreMap, hasPreferences, matchCount } = usePersonalizedFeed(timeFiltered, {
    enabled: feedMode === 'personalized' && !!user,
  })

  const baseList = feedMode === 'personalized' && user && hasPreferences ? forYou : timeFiltered

  const featured = useMemo(() => {
    if (feedMode === 'personalized' && user && hasPreferences) {
      return baseList
        .filter((a) => HIGH_PRIORITY.includes(a.category))
        .slice(0, 3)
    }
    return baseList
      .filter((a) => HIGH_PRIORITY.includes(a.category))
      .sort((a, b) => new Date(b.date_scraped) - new Date(a.date_scraped))
      .slice(0, 3)
  }, [baseList, feedMode, user, hasPreferences])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const featuredIds = new Set(featured.map((f) => f.id))
    const matches = baseList.filter((item) => {
      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter
      const matchesType = typeFilter === 'ALL' || item.institution_type === typeFilter
      const matchesSearch =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.university_name?.toLowerCase().includes(q) ||
        (item.summary && item.summary.toLowerCase().includes(q))
      return matchesCat && matchesType && matchesSearch && !featuredIds.has(item.id)
    })

    const perUniversityCap = 2
    const isUniSpecificSearch = q.length > 2
    if (isUniSpecificSearch) return matches

    const counts = {}
    const result = []
    for (const item of matches) {
      const key = item.university_name
      counts[key] = (counts[key] || 0) + 1
      if (counts[key] <= perUniversityCap) result.push(item)
    }
    return result
  }, [baseList, featured, search, typeFilter, categoryFilter])

  const visibleItems = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount
  const isSearching = search || typeFilter !== 'ALL' || categoryFilter !== 'ALL'

  const handlePreview = (item) => {
    requireAuth(() => setSelectedItem(item), 'read the full notice')
  }

  const timeOptions = TIME_FILTERS

  const showPersonalizedSection = feedMode === 'personalized' && user && hasPreferences
  const featuredTitle = showPersonalizedSection ? 'Picked for You' : 'Important Updates'
  const featuredIcon = showPersonalizedSection ? (
    <Star size={14} className="text-purple-500" fill="currentColor" />
  ) : (
    <Star size={14} className="text-amber-500" fill="currentColor" />
  )
  const featuredBg = showPersonalizedSection ? 'bg-purple-50' : 'bg-amber-50'
  const featuredBadge = showPersonalizedSection ? 'FOR YOU' : 'IMPORTANT'
  const featuredBadgeBg = showPersonalizedSection ? 'bg-purple-500' : 'bg-amber-500'

  return (
    <div className="max-w-6xl w-full mx-auto px-6 py-8 md:py-12 flex flex-col gap-10">
      <Hero />

      <UniMarquee />

      <RevealWrapper>
        <Filters
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
        />
      </RevealWrapper>

      {user && (
        <FeedToggle
          mode={feedMode}
          onChange={setFeedMode}
          matchCount={matchCount}
          hasPreferences={hasPreferences}
        />
      )}

      <div className="flex items-center justify-between -mt-4">
        <div className="flex items-center gap-2 text-xs text-apple-gray">
          <Filter size={14} />
          <span className="font-medium">
            {filtered.length + featured.length} update{filtered.length + featured.length === 1 ? '' : 's'}
            {showPersonalizedSection && (
              <span className="text-purple-600 ml-1.5">· personalized for you</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {readCount > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-apple-gray hover:text-apple-blue transition-colors underline decoration-dotted"
            >
              Reset {readCount} read
            </button>
          )}
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-apple-gray" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-apple-blue cursor-pointer hover:border-gray-300 transition-colors"
            >
              {timeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {status === 'connecting' && announcements.length === 0 ? (
        <div className="py-20 text-center text-apple-gray flex flex-col items-center justify-center gap-4">
          <Loader2 size={32} className="animate-spin text-apple-blue" />
          <p className="text-sm font-medium">Connecting to live feed...</p>
        </div>
      ) : (
        <>
          {featured.length > 0 && !isSearching && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full ${featuredBg} flex items-center justify-center`}>
                  {featuredIcon}
                </div>
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  {featuredTitle}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((item, i) => {
                  const reasons = scoreMap.get(item.id)?.reasons || []
                  return (
                    <div key={item.id} className="relative">
                      <div className={`absolute -top-2 -left-2 z-10 ${featuredBadgeBg} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md`}>
                        {featuredBadge}
                      </div>
                      <AnnouncementCard
                        item={item}
                        index={i}
                        onClick={() => handlePreview(item)}
                        forYouReasons={showPersonalizedSection ? reasons : []}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {visibleItems.length === 0 && featured.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-gray-100 shadow-apple max-w-2xl mx-auto w-full">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={28} className="text-apple-blue" />
              </div>
              <p className="text-xl font-semibold mb-2">
                {isSearching ? 'No results found' : 'No announcements yet'}
              </p>
              <p className="text-sm text-apple-gray max-w-md mx-auto">
                {isSearching
                  ? 'Try adjusting your search or filters.'
                  : 'Our scraper runs every few hours. New updates appear here automatically.'}
              </p>
            </div>
          ) : visibleItems.length > 0 ? (
            <section className="space-y-6">
              {featured.length > 0 && (
                <div className="flex items-center gap-2 pt-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-apple-gray">
                    {showPersonalizedSection ? 'More for You' : 'Latest Updates'}
                  </h2>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleItems.map((item, index) => {
                  const reasons = scoreMap.get(item.id)?.reasons || []
                  return (
                    <AnnouncementCard
                      key={item.id}
                      item={item}
                      index={index}
                      onClick={() => handlePreview(item)}
                      forYouReasons={showPersonalizedSection ? reasons : []}
                    />
                  )
                })}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="bg-white hover:bg-apple-dark hover:text-white border border-gray-200 text-apple-dark font-medium px-8 py-3 rounded-full text-sm transition-all duration-300 hover:-translate-y-0.5 shadow-apple hover:shadow-apple-hover"
                  >
                    Load More ({filtered.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </section>
          ) : null}
        </>
      )}

      <AnnouncementModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      <AuthGateModal open={gateOpen} onClose={closeGate} reason={reason} />
    </div>
  )
}
