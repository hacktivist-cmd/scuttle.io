import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, RefreshCw, CheckCircle2, XCircle, HelpCircle,
  Loader2, AlertTriangle, ExternalLink, Activity,
} from 'lucide-react'
import { timeAgo } from '../../lib/timeAgo'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AdminHealth() {
  const [unis, setUnis] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setRefreshing(true)
    try {
      const res = await fetch(`${API}/api/v1/admin/health`)
      if (res.ok) setUnis(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const stats = useMemo(() => {
    const ok = unis.filter((u) => u.status === 'ok').length
    const failed = unis.filter((u) => u.status === 'failed').length
    const unknown = unis.filter((u) => u.status === 'unknown').length
    const totalAnn = unis.reduce((sum, u) => sum + u.announcements, 0)
    return { ok, failed, unknown, total: unis.length, totalAnn }
  }, [unis])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return unis.filter((u) => {
      const matchesSearch =
        !q || u.name.toLowerCase().includes(q) || u.short_code.toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'OK' && u.status === 'ok') ||
        (statusFilter === 'FAILED' && u.status === 'failed') ||
        (statusFilter === 'NEVER' && u.status === 'unknown')
      return matchesSearch && matchesStatus
    })
  }, [unis, search, statusFilter])

  const StatusBadge = ({ status }) => {
    if (status === 'ok')
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
          <CheckCircle2 size={10} /> OK
        </span>
      )
    if (status === 'failed')
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md">
          <XCircle size={10} /> FAILED
        </span>
      )
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-apple-gray bg-gray-100 px-2 py-0.5 rounded-md">
        <HelpCircle size={10} /> NEVER
      </span>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1">Scraper Health</h1>
          <p className="text-apple-gray text-sm">
            Status of all {stats.total} tracked universities
          </p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-apple">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mb-3">
            <CheckCircle2 size={16} className="text-green-600" />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-apple-gray font-semibold">Working</p>
          <p className="text-2xl font-semibold">{stats.ok}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-apple">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center mb-3">
            <XCircle size={16} className="text-red-600" />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-apple-gray font-semibold">Failed</p>
          <p className="text-2xl font-semibold">{stats.failed}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-apple">
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
            <HelpCircle size={16} className="text-apple-gray" />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-apple-gray font-semibold">Never Run</p>
          <p className="text-2xl font-semibold">{stats.unknown}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-apple">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
            <Activity size={16} className="text-apple-blue" />
          </div>
          <p className="text-[10px] uppercase tracking-wider text-apple-gray font-semibold">Announcements</p>
          <p className="text-2xl font-semibold">{stats.totalAnn}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-apple overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search university..."
              className="w-full pl-11 pr-4 py-2.5 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-apple-bg border-transparent rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="OK">Working Only</option>
            <option value="FAILED">Failed Only</option>
            <option value="NEVER">Never Run</option>
          </select>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 size={28} className="animate-spin text-purple-600 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-apple-gray">
            <AlertTriangle size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No universities match your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr className="text-left text-[10px] uppercase tracking-wider text-apple-gray font-semibold">
                  <th className="px-4 py-3">University</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-center">Announcements</th>
                  <th className="px-4 py-3">Last Scraped</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.short_code} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium leading-tight">{u.name}</p>
                        <p className="text-[10px] text-apple-gray mt-0.5">{u.short_code}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] bg-gray-100 text-apple-gray px-2 py-0.5 rounded">
                        {u.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold">{u.announcements}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-apple-gray">
                        {u.last_scraped_at ? timeAgo(u.last_scraped_at) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={u.base_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-apple-gray hover:text-apple-blue transition-colors inline-flex"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
