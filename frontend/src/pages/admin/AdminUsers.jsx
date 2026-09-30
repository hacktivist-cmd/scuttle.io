import { useEffect, useMemo, useState } from 'react'
import { Search, Users, Mail, Loader2, Shield, Calendar, CheckCircle2, XCircle } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'))
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'ADMIN' && u.isAdmin) ||
        (filter === 'NEWSLETTER' && u.newsletterEnabled)
      return matchesSearch && matchesFilter
    })
  }, [users, search, filter])

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Users</h1>
        <p className="text-apple-gray text-sm">
          {users.length} total users · {users.filter((u) => u.newsletterEnabled).length} subscribed to newsletter
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-apple overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-11 pr-4 py-2.5 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm transition-all"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-apple-bg border-transparent rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">All Users</option>
            <option value="ADMIN">Admins Only</option>
            <option value="NEWSLETTER">Newsletter Subscribers</option>
          </select>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 size={28} className="animate-spin text-purple-600 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-apple-gray">
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr className="text-left text-[11px] uppercase tracking-wider text-apple-gray font-semibold">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Interests</th>
                  <th className="px-6 py-3">Newsletter</th>
                  <th className="px-6 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {(u.name || u.email)?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{u.name || 'Unnamed'}</p>
                            {u.isAdmin && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                                <Shield size={9} /> ADMIN
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-apple-gray truncate flex items-center gap-1">
                            <Mail size={11} /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.interests?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.interests.slice(0, 3).map((i) => (
                            <span key={i} className="text-[10px] bg-blue-50 text-apple-blue px-2 py-0.5 rounded-md">
                              {i}
                            </span>
                          ))}
                          {u.interests.length > 3 && (
                            <span className="text-[10px] text-apple-gray">+{u.interests.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-apple-gray">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.newsletterEnabled ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                          <CheckCircle2 size={14} /> Subscribed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-apple-gray">
                          <XCircle size={14} /> Not subscribed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-apple-gray flex items-center gap-1.5">
                        <Calendar size={12} />
                        {u.createdAt?.toDate?.().toLocaleDateString() || 'Unknown'}
                      </span>
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
