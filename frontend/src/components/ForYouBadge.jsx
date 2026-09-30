import { Sparkles, GraduationCap, Clock } from 'lucide-react'

export default function ForYouBadge({ reasons = [], compact = false }) {
  if (!reasons || reasons.length === 0) return null

  const hasUniversity = reasons.includes('university')
  const hasCategory = reasons.includes('category')
  const isFresh = reasons.includes('fresh')

  let label = 'For you'
  let Icon = Sparkles
  let className = 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'

  if (hasUniversity) {
    label = 'Followed'
    Icon = GraduationCap
    className = 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
  } else if (hasCategory) {
    label = 'Your Interest'
    Icon = Sparkles
    className = 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white'
  } else if (isFresh) {
    label = 'Fresh'
    Icon = Clock
    className = 'bg-gradient-to-r from-emerald-500 to-green-400 text-white'
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-semibold shadow-sm ${className} ${
        compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-0.5 text-[10px]'
      }`}
    >
      <Icon size={compact ? 9 : 10} strokeWidth={2.5} />
      {label}
    </div>
  )
}
