import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'scuttleadmin@gmail.com').toLowerCase()

export default function AdminLogin() {
  const { user, profile, signIn, logOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user && profile?.isAdmin === true) {
      navigate('/admin', { replace: true })
    }
  }, [user, profile, authLoading, navigate])

  useEffect(() => {
    if (!authLoading && user && profile && profile.isAdmin !== true) {
      logOut()
    }
  }, [user, profile, authLoading, logOut])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setError('This account is not authorized for admin access.')
      return
    }
    setLoading(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError((err.message || '').replace('Firebase: ', '') || 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to site
        </button>
        <div className="bg-white rounded-[2rem] p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg mb-4">
              <Shield size={26} className="text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-1">Admin Access</h1>
            <p className="text-apple-gray text-sm">Restricted area. Authorized personnel only.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5">
              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-apple-dark">Admin Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@scuttle.io"
                  className="w-full pl-11 pr-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-sm transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-apple-dark">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white text-sm transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-8 py-3.5 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? (<><Loader2 size={18} className="animate-spin" /> Authenticating...</>) : (<><Shield size={18} /> Sign in as Admin</>)}
            </button>
          </form>

          <p className="text-center text-xs text-apple-gray mt-6">
            Separate from regular login. Only authorized admins can access this page.
          </p>
        </div>
      </div>
    </div>
  )
}
