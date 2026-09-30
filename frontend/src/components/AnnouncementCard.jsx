import { Eye, ChevronRight, Lock } from 'lucide-react'
import { useReadTracking } from '../hooks/useReadTracking'
import { useAuth } from '../contexts/AuthContext'
import ForYouBadge from './ForYouBadge'

export default function AnnouncementCard({ item, index, onClick, forYouReasons = [] }) {
  const { isRead } = useReadTracking()
  const { user } = useAuth()
  const read = isRead(item.id)
  const locked = !user
  const hasBadge = user && forYouReasons.length > 0

  return (
    <div
      className={`group relative overflow-hidden bg-white rounded-[2rem] p-6 shadow-apple border flex flex-col justify-between transition-all duration-500 ease-out hover:shadow-apple-hover hover:-translate-y-2 opacity-0 animate-card-enter ${
        read ? 'border-gray-100 opacity-80' : 'border-gray-100'
      }`}
      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-[left] duration-700 pointer-events-none group-hover:left-full" />

      {!read && user && !hasBadge && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-apple-blue shadow-[0_0_8px_rgba(0,113,227,0.6)] animate-pulse" />
      )}

      {locked && (
        <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
          <Lock size={11} className="text-apple-gray" />
        </span>
      )}

      {hasBadge && (
        <div className="absolute top-4 right-4 z-10">
          <ForYouBadge reasons={forYouReasons} />
        </div>
      )}

      <div className="space-y-4 relative">
        <div className="flex justify-between items-start gap-3">
          <span className="bg-blue-50 text-apple-blue text-[11px] font-semibold px-3 py-1 rounded-full border border-blue-100 uppercase tracking-wide transition-transform duration-300 group-hover:scale-105">
            {item.institution_type || 'University'}
          </span>
          <span className="bg-gray-50 text-apple-gray text-[11px] font-medium px-3 py-1 rounded-full border border-gray-100 mr-16">
            {item.category}
          </span>
        </div>

        <h3 className={`font-semibold text-lg leading-snug transition-colors duration-300 group-hover:text-apple-blue ${read ? 'text-apple-gray' : 'text-apple-dark'}`}>
          {item.title}
        </h3>

        <p className="text-apple-gray text-sm leading-relaxed line-clamp-3">
          {item.summary || 'No summary provided.'}
        </p>
      </div>

      <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between relative">
        <span className="text-xs text-apple-gray font-medium truncate max-w-[130px]">
          {item.university_name}
        </span>
        <button
          onClick={onClick}
          className="bg-apple-bg group-hover:bg-apple-blue group-hover:text-white text-apple-dark font-medium px-5 py-2 rounded-full text-xs transition-all duration-300 flex items-center gap-1.5 hover:scale-[1.03]"
        >
          {locked ? <Lock size={12} /> : <Eye size={14} />}
          <span>{locked ? 'Sign in' : read ? 'Read Again' : 'Preview'}</span>
          <ChevronRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  )
}
