import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Users, Mail, Loader2, Shield, Calendar, CheckCircle2, XCircle,
  Ban, Trash2, RotateCcw, KeyRound, AlertCircle, Check, X,
} from 'lucide-react'
import {
  collection, getDocs, query, orderBy,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { db } from '../../lib/firebase'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/** Get Firebase ID token for authenticated backend requests */
async function authHeader() {
  const user = getAuth().currentUser
  if (!user) throw new Error('Not signed in')
  const token = await user.getIdToken(true)
  return { Authorization: `Bearer ${token}` }
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [actionLoading, setActionLoading] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [suspendReason, setSuspendReason] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'users'))
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      // Sort client-side: admins first, then alphabetically
      arr.sort((a, b) => {
        if (a.isAdmin && !b.isAdmin) return -1
        if (!a.isAdmin && b.isAdmin) return 1
        return (a.email || '').localeCompare(b.email || '')
      })
      setUsers(arr)
    } catch (err) {
      console.error(err)
      showToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.id?.toLowerCase().includes(q)
      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'ADMIN' && u.isAdmin) ||
        (filter === 'SUSPENDED' && u.suspended) ||
        (filter === 'NEWSLETTER' && u.newsletterEnabled) ||
        (filter === 'ACTIVE' && !u.suspended && !u.isAdmin)
      return matchesSearch && matchesFilter
    })
  }, [users, search, filter])

  const handleSuspend = async (user, reason) => {
    if (user.isAdmin) {
      showToast('Cannot suspend an admin', 'error')
      return
    }
    setActionLoading(user.id)
    try {
      const headers = await authHeader()
      const res = await fetch(
        `${API}/api/v1/admin/users/${user.id}/suspend?reason=${encodeURIComponent(reason || 'Policy violation')}`,
        { method: 'POST', headers }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      setUsers((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, suspended: true, suspendedAt: new Date().toISOString(), suspendedReason: reason } : u
      ))
      showToast(`${user.email} suspended`)
      setSuspendReason('')
    } catch (err) {
      showToast(err.message || 'Suspend failed', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnsuspend = async (user) => {
    setActionLoading(user.id)
    try {
      const headers = await authHeader()
      const res = await fetch(`${API}/api/v1/admin/users/${user.id}/unsuspend`, { method: 'POST', headers })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      setUsers((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, suspended: false, suspendedAt: null, suspendedReason: null } : u
      ))
      showToast(`${user.email} restored`)
    } catch (err) {
      showToast(err.message || 'Unsuspend failed', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (user) => {
    if (user.isAdmin) {
      showToast('Cannot delete an admin', 'error')
      return
    }
    setActionLoading(user.id)
    try {
      const headers = await authHeader()
      const res = await fetch(`${API}/api/v1/admin/users/${user.id}`, { method: 'DELETE', headers })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `HTTP ${res.status}`)
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      showToast(`${user.email} deleted permanently`)
      setConfirmDelete(null)
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.isAdmin).length,
    suspended: users.filter((u) => u.suspended).length,
    subscribed: users.filter((u) => u.newsletterEnabled).length,
  }), [users])

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1">Users</h1>
        <p className="text-apple-gray text-sm">
          {stats.total} total · {stats.admins} admins · {stats.suspended} suspended · {stats.subscribed} subscribed
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Users} label="Total" value={stats.total} color="blue" />
        <StatCard icon={Shield} label="Admins" value={stats.admins} color="purple" />
        <StatCard icon={Ban} label="Suspended" value={stats.suspended} color="red" />
        <StatCard icon={Mail} label="Subscribed" value={stats.subscribed} color="green" />
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-apple overflow-hidden">
        {/* Filters */}
        <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or UID..."
              className="w-full pl-11 pr-4 py-2.5 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm transition-all"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-apple-bg border-transparent rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">All Users</option>
            <option value="ACTIVE">Active Only</option>
            <option value="ADMIN">Admins Only</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="NEWSLETTER">Subscribed</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 size={28} className="animate-spin text-purple-600 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-apple-gray">
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No users match your filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((u) => {
              const isBusy = actionLoading === u.id
              return (
                <div key={u.id} className={`p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 hover:bg-gray-50/50 transition-colors ${u.suspended ? 'bg-red-50/30' : ''}`}>
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                      u.suspended
                        ? 'bg-red-100 text-red-700'
                        : u.isAdmin
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {(u.name || u.email)?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${u.suspended ? 'text-red-700' : ''}`}>
                          {u.name || 'Unnamed'}
                        </p>
                        {u.isAdmin && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            <Shield size={9} /> ADMIN
                          </span>
                        )}
                        {u.suspended && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                            <Ban size={9} /> SUSPENDED
                          </span>
                        )}
                        {u.newsletterEnabled && !u.suspended && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                            <Mail size={9} /> SUB
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-apple-gray truncate flex items-center gap-1 mt-0.5">
                        <Mail size={11} /> {u.email}
                      </p>
                      {u.suspended && u.suspendedReason && (
                        <p className="text-[11px] text-red-600 mt-1 italic">
                          Reason: {u.suspendedReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-apple-gray">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {u.createdAt?.toDate?.().toLocaleDateString() || 'Unknown'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isBusy ? (
                      <Loader2 size={16} className="animate-spin text-purple-600 mx-2" />
                    ) : (
                      <>
                        {!u.isAdmin && !u.suspended && (
                          <button
                            onClick={() => setConfirmDelete({ action: 'suspend', user: u })}
                            title="Suspend user"
                            className="p-2 rounded-lg hover:bg-amber-50 text-apple-gray hover:text-amber-600 transition-colors"
                          >
                            <Ban size={15} />
                          </button>
                        )}
                        {u.suspended && (
                          <button
                            onClick={() => handleUnsuspend(u)}
                            title="Restore user"
                            className="p-2 rounded-lg hover:bg-green-50 text-apple-gray hover:text-green-600 transition-colors"
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}
                        {!u.isAdmin && (
                          <button
                            onClick={() => setConfirmDelete({ action: 'delete', user: u })}
                            title="Delete permanently"
                            className="p-2 rounded-lg hover:bg-red-50 text-apple-gray hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  confirmDelete.action === 'delete' ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                  {confirmDelete.action === 'delete' ? (
                    <Trash2 size={22} className="text-red-600" />
                  ) : (
                    <Ban size={22} className="text-amber-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {confirmDelete.action === 'delete' ? 'Delete permanently?' : 'Suspend user?'}
                  </h3>
                  <p className="text-sm text-apple-gray leading-relaxed">
                    {confirmDelete.action === 'delete' ? (
                      <>This will permanently remove <strong>{confirmDelete.user.email}</strong> from Firestore and Firebase Auth. This cannot be undone.</>
                    ) : (
                      <>This will block <strong>{confirmDelete.user.email}</strong> from signing in. They can be restored later.</>
                    )}
                  </p>
                </div>
              </div>

              {confirmDelete.action === 'suspend' && (
                <div className="mb-5">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="e.g. Spam, abuse, policy violation"
                    className="w-full px-4 py-2.5 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-sm"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-apple-dark py-3 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmDelete.action === 'delete') {
                      handleDelete(confirmDelete.user)
                    } else {
                      handleSuspend(confirmDelete.user, suspendReason)
                      setConfirmDelete(null)
                    }
                  }}
                  className={`flex-1 py-3 rounded-xl font-medium text-white transition-colors ${
                    confirmDelete.action === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {confirmDelete.action === 'delete' ? 'Delete' : 'Suspend'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium z-[110] ${
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
  }
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-apple">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <p className="text-[10px] uppercase tracking-wider text-apple-gray font-semibold mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}
