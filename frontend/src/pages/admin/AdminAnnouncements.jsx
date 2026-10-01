import { FileText } from 'lucide-react'

export default function AdminAnnouncements() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1">Announcements</h1>
      <p className="text-apple-gray text-sm mb-8">
        Manage scraped announcements, edit summaries, or delete entries.
      </p>
      <div className="bg-white rounded-2xl p-8 sm:p-12 md:p-16 border border-gray-100 shadow-apple text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <FileText size={24} className="text-apple-gray" />
        </div>
        <p className="text-lg font-semibold mb-2">Coming Soon</p>
        <p className="text-sm text-apple-gray max-w-md mx-auto">
          Announcement management tools — edit, delete, pin to top — will appear here in a future update.
        </p>
      </div>
    </div>
  )
}
