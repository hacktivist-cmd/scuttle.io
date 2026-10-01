import { useEffect, useMemo, useState } from 'react'
import { Mail, Send, Loader2, Users, CheckCircle2, Sparkles } from 'lucide-react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../lib/firebase'

export default function AdminNewsletter() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'))
        setUsers(snap.docs.map((d) => d.data()))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const subscribers = useMemo(
    () => users.filter((u) => u.newsletterEnabled && u.email),
    [users]
  )

  const handleSend = async (e) => {
    e.preventDefault()
    if (!subject || !message) return
    if (!confirm(`Send this newsletter to ${subscribers.length} subscribers?`)) return

    setSending(true)
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API}/api/v1/send-newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
          recipients: subscribers.map((s) => ({ email: s.email, name: s.name })),
        }),
      })
      if (res.ok) {
        setSent(true)
        setSubject('')
        setMessage('')
        setTimeout(() => setSent(false), 5000)
      } else {
        alert('Failed to send. Check backend logs.')
      }
    } catch (err) {
      console.error(err)
      alert('Network error sending newsletter.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1">Newsletter</h1>
        <p className="text-apple-gray text-sm">
          Broadcast updates to your subscribers. They'll receive it via email until they unsubscribe.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Subscriber count card */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-apple">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center mb-4">
              <Users size={20} className="text-green-600" />
            </div>
            <p className="text-xs uppercase tracking-wider text-apple-gray font-semibold mb-1">
              Active Subscribers
            </p>
            {loading ? (
              <Loader2 size={24} className="animate-spin text-apple-gray" />
            ) : (
              <p className="text-4xl font-semibold">{subscribers.length}</p>
            )}
            <p className="text-xs text-apple-gray mt-2">
              of {users.length} total users
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <Sparkles size={20} className="mb-3 opacity-90" />
            <p className="text-sm font-semibold mb-1">Auto-Send Enabled</p>
            <p className="text-xs opacity-90 leading-relaxed">
              High-priority announcements are automatically emailed to subscribers every 6 hours.
            </p>
          </div>
        </div>

        {/* Compose panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-apple overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <Mail size={20} className="text-purple-600" />
              <div>
                <h2 className="text-sm font-semibold">Compose Newsletter</h2>
                <p className="text-xs text-apple-gray">Send a custom broadcast to all subscribers</p>
              </div>
            </div>

            {sent && (
              <div className="m-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700 font-medium">
                  Newsletter queued! Subscribers will receive it shortly.
                </p>
              </div>
            )}

            <form onSubmit={handleSend} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. New JAMB CAPS update for UNILAG"
                  required
                  className="w-full px-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="10"
                  required
                  placeholder="Write your newsletter content here..."
                  className="w-full px-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-sm transition-all resize-none"
                />
                <p className="text-xs text-apple-gray mt-2">
                  {message.length} characters · HTML not supported yet
                </p>
              </div>

              <button
                type="submit"
                disabled={sending || subscribers.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3.5 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {sending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} /> Send to {subscribers.length} Subscribers
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
