import { useEffect, useState } from 'react'
import { Users, FileText, Mail, TrendingUp, Loader2 } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'

function StatCard({ icon: Icon, label, value, color = 'blue', loading }) {
  const colors = {
    blue: 'bg-blue-50 text-apple-blue',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-apple">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-xs uppercase tracking-wider text-apple-gray font-semibold mb-1">{label}</p>
      {loading ? (
        <Loader2 size={24} className="animate-spin text-apple-gray" />
      ) : (
        <p className="text-3xl font-semibold">{value}</p>
      )}
    </div>
  )
}

export default function AdminHome() {
  const [stats, setStats] = useState({ users: 0, newsletter: 0, admins: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'))
        const users = snap.docs.map((d) => d.data())
        setStats({
          users: users.length,
          newsletter: users.filter((u) => u.newsletterEnabled).length,
          admins: users.filter((u) => u.isAdmin).length,
        })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Overview</h1>
        <p className="text-apple-gray text-sm">Welcome back. Here's what's happening on Scuttle.io.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard icon={Users} label="Total Users" value={stats.users} color="blue" loading={loading} />
        <StatCard icon={Mail} label="Newsletter Subs" value={stats.newsletter} color="green" loading={loading} />
        <StatCard icon={TrendingUp} label="Admins" value={stats.admins} color="purple" loading={loading} />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-apple">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="/admin/scraper" className="p-4 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors">
            <p className="font-medium text-sm mb-1">Trigger Manual Scrape</p>
            <p className="text-xs text-apple-gray">Run the scraper immediately across all institutions.</p>
          </a>
          <a href="/admin/newsletter" className="p-4 rounded-xl bg-gray-50 hover:bg-purple-50 transition-colors">
            <p className="font-medium text-sm mb-1">Send Newsletter</p>
            <p className="text-xs text-apple-gray">Broadcast an email/WhatsApp to all subscribers.</p>
          </a>
        </div>
      </div>
    </div>
  )
}
