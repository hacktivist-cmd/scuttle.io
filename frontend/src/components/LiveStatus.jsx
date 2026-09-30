import { useAnnouncements } from '../hooks/useAnnouncements'

export default function LiveStatus() {
  const { status } = useAnnouncements()

  const config = {
    live: { text: 'Live Sync', color: 'green', pulse: true },
    connecting: { text: 'Connecting...', color: 'gray', pulse: false },
    error: { text: 'Sync Error', color: 'amber', pulse: false },
  }

  const c = config[status] || config.connecting

  const colorMap = {
    green: 'text-green-700 bg-green-50',
    gray: 'text-apple-gray bg-gray-100',
    amber: 'text-amber-700 bg-amber-50',
  }
  const dotColor = {
    green: 'bg-green-500',
    gray: 'bg-gray-400',
    amber: 'bg-amber-500',
  }

  return (
    <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-all duration-500 ${colorMap[c.color]}`}>
      <span className="relative flex w-2 h-2">
        <span className={`absolute inset-0 rounded-full ${dotColor[c.color]} opacity-75 ${c.pulse ? 'animate-ping-dot' : ''}`} />
        <span className={`relative rounded-full w-2 h-2 ${dotColor[c.color]}`} />
      </span>
      {c.text}
    </span>
  )
}
