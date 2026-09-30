import { motion } from 'framer-motion'
import { Sparkles, Layers, Settings2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FeedToggle({ mode, onChange, matchCount, hasPreferences }) {
  const tabs = [
    { id: 'personalized', label: 'For You', Icon: Sparkles, badge: matchCount > 0 ? matchCount : null },
    { id: 'all', label: 'All Updates', Icon: Layers },
  ]

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="inline-flex items-center bg-white rounded-2xl p-1 shadow-apple border border-gray-100">
        {tabs.map(({ id, label, Icon, badge }) => {
          const active = mode === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                active ? 'text-white' : 'text-apple-gray hover:text-apple-dark'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="feed-toggle-active"
                  className="absolute inset-0 rounded-xl bg-apple-dark shadow-md"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                <Icon size={14} className={active ? 'text-amber-300' : ''} />
                {label}
                {badge !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-apple-bg text-apple-gray'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {!hasPreferences && (
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-apple-blue hover:opacity-70 transition-opacity bg-blue-50 px-3 py-2 rounded-xl"
        >
          <Settings2 size={13} />
          Set your interests for a personalized feed
        </Link>
      )}
    </div>
  )
}
