import { Search } from 'lucide-react'

const CATEGORIES = [
  { key: 'ALL', label: 'All' },
  { key: 'Post-UTME', label: 'Post-UTME' },
  { key: 'Admission List', label: 'Admissions' },
  { key: 'School Fees', label: 'Fees' },
  { key: 'JAMB CAPS', label: 'JAMB CAPS' },
]

const TYPES = [
  { value: 'ALL', label: 'All Types' },
  { value: 'Federal University', label: 'Federal Universities' },
  { value: 'State University', label: 'State Universities' },
  { value: 'Private University', label: 'Private Universities' },
  { value: 'Polytechnic', label: 'Polytechnics' },
  { value: 'Board', label: 'JAMB & Boards' },
]

export default function Filters({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  categoryFilter,
  onCategoryChange,
}) {
  return (
    <section className="bg-white rounded-[2rem] p-6 shadow-apple border border-gray-100 flex flex-col lg:flex-row gap-6 items-center justify-between">
      <div className="w-full lg:w-1/3 relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search university or keyword..."
          className="w-full pl-12 pr-4 py-3 bg-apple-bg border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all duration-300 hover:bg-gray-100"
        />
      </div>

      <div className="w-full lg:w-auto flex items-center gap-3">
        <label className="text-xs font-medium text-apple-gray uppercase tracking-wider whitespace-nowrap">
          Type
        </label>
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="w-full lg:w-auto bg-apple-bg border-transparent rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white transition-all duration-300 cursor-pointer hover:bg-gray-100"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full lg:w-auto flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => onCategoryChange(c.key)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.04] ${
              categoryFilter === c.key
                ? 'bg-apple-dark text-white scale-105'
                : 'bg-apple-bg text-apple-dark hover:bg-gray-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </section>
  )
}
