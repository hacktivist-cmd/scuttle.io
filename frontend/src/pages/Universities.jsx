import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ExternalLink, ChevronRight } from 'lucide-react'
import { universitiesData } from '../data/universities'
import RevealWrapper from '../components/RevealWrapper'
import UniversityLogo from '../components/UniversityLogo'
import { useSEO } from '../hooks/useSEO'

const TYPES = [
  { value: 'ALL', label: 'All Types' },
  { value: 'Federal University', label: 'Federal Universities' },
  { value: 'State University', label: 'State Universities' },
  { value: 'Private University', label: 'Private Universities' },
  { value: 'Polytechnic', label: 'Polytechnics' },
  { value: 'Board', label: 'JAMB & Boards' },
]

export default function Universities() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const navigate = useNavigate()

  useSEO({
    title: 'University Directory',
    description: 'Browse all 200+ Nigerian Federal, State, Private universities and Polytechnics tracked by Scuttle.io.',
    canonical: 'https://scuttle.io/universities',
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return universitiesData.filter(
      (u) =>
        (typeFilter === 'ALL' || u.type === typeFilter) &&
        (u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q))
    )
  }, [search, typeFilter])

  const handleUniClick = (uni) => {
    navigate('/', { state: { searchTerm: uni.name.split(',')[0].trim() } })
  }

  return (
    <div className="max-w-6xl w-full mx-auto px-6 py-12">
      <RevealWrapper>
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            University Directory
          </h1>
          <p className="text-apple-gray text-lg">
            Browse all {universitiesData.length} tracked Federal, State, Private, and Polytechnic institutions.
          </p>
        </div>
      </RevealWrapper>

      <RevealWrapper delay={100}>
        <div className="bg-white rounded-[2rem] p-6 shadow-apple border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between mb-8 max-w-4xl mx-auto">
          <div className="w-full md:w-1/2 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search university name or code..."
              className="w-full pl-12 pr-4 py-3 bg-apple-bg border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all duration-300"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full md:w-auto bg-apple-bg border-transparent rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white transition-all duration-300 cursor-pointer"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </RevealWrapper>

      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-[2rem] border border-gray-100 shadow-apple max-w-2xl mx-auto">
          <p className="text-lg font-medium">No institutions found</p>
          <p className="text-sm text-apple-gray mt-1">Try adjusting your search query or type filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((uni, index) => (
            <div
              key={uni.code}
              style={{ animationDelay: `${Math.min(index * 20, 500)}ms` }}
              className="group bg-white rounded-2xl p-5 shadow-apple border border-gray-100 flex items-center justify-between transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] opacity-0 animate-card-enter"
            >
              <button
                onClick={() => handleUniClick(uni)}
                className="flex items-center gap-4 flex-1 text-left min-w-0"
              >
                <UniversityLogo university={uni} size={48} />
                <div className="min-w-0">
                  <h4 className="font-semibold text-sm leading-tight transition-colors group-hover:text-apple-blue truncate">
                    {uni.name}
                  </h4>
                  <p className="text-[11px] text-apple-gray font-medium mt-1">{uni.code}</p>
                </div>
              </button>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={uni.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-50 hover:bg-blue-50 text-apple-gray hover:text-apple-blue transition-colors"
                  title="Visit Website"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => handleUniClick(uni)}
                  className="text-gray-300 group-hover:text-apple-blue transition-all duration-300 group-hover:translate-x-0.5"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
