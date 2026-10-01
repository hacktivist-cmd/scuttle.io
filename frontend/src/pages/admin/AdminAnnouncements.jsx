import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Trash2, ExternalLink, Loader2, FileText,
  AlertCircle, CheckCircle2, X
} from 'lucide-react'
import { timeAgo } from '../../lib/timeAgo'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/admin/announcements?limit=200`)
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const categories = useMemo(() => {
    const set = new Set(announcements.map((a) => a.category))
    return ['ALL', ...Array.from(set).sort()]
  }, [announcements])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return announcements.filter((a) => {
      const matchesSearch =
        !q ||
        a.title?.toLowerCase().includes(q) ||
        a.university_name?.toLowerCase().includes(q)
      const matchesCategory = category === 'ALL' || a.category === category
      return matchesSearch && matchesCategory
    })
  }, [announcements, search, category])

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((a) => a.id)))
    }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`${API}/api/v1/admin/announcements/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id))
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
        showToast('Announcement deleted')
      } else {
        showToast('Delete failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} announcement(s)? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`${API}/api/v1/admin/announcements/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })
      if (res.ok) {
        const { deleted } = await res.json()
        setAnnouncements((prev) => prev.filter((a) => !selected.has(a.id)))
        setSelected(new Set())
        showToast(`${deleted} deleted`)
      } else {
        showToast('Bulk delete failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1">Announcements</h1>
          <p className="text-apple-gray text-sm">
            {announcements.length} total · Manage, delete, or clean up old content
          </p>
        </div>
        {selected.size > 0 && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={handleBulkDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Trash2 size={15} />
            Delete {selected.size} Selected
          </motion.button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-apple overflow-hidden">
        <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or university..."
              className="w-full pl-11 pr-4 py-2.5 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm transition-all"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-apple-bg border-transparent rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 size={28} className="animate-spin text-purple-600 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-apple-gray">
            <FileText size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No announcements found.</p>
          </div>
        ) : (
          <>
            {/* Select all row */}
            <div className="px-4 md:px-5 py-2.5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3 text-xs">
              <input
                type="checkbox"
                checked={selected.size === filtered.length && filtered.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
              />
              <span className="text-apple-gray font-medium">
                Select all ({filtered.length})
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {filtered.map((a) => (
                <div key={a.id} className="p-4 md:p-5 flex items-start gap-3 hover:bg-gray-50/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.has(a.id)}
                    onChange={() => toggleSelect(a.id)}
                    className="mt-1 w-4 h-4 rounded accent-purple-600 cursor-pointer flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="bg-blue-50 text-apple-blue text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase">
                        {a.university_code}
                      </span>
                      <span className="bg-gray-100 text-apple-gray text-[10px] font-medium px-2 py-0.5 rounded-md">
                        {a.category}
                      </span>
                      <span className="text-[10px] text-apple-gray">
                        {timeAgo(a.date_published || a.date_scraped)}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1 leading-snug">{a.title}</p>
                    <p className="text-xs text-apple-gray line-clamp-1">{a.summary || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={a.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-gray-100 text-apple-gray hover:text-apple-blue transition-colors"
                      title="Open source"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => handleDelete(a.id)}
                      disabled={deleting}
                      className="p-2 rounded-lg hover:bg-red-50 text-apple-gray hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium ${
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
