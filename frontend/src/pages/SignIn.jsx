import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function SignIn() {
  const { signIn, signInWithGoogle, signInWithApple } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''))
    } finally {
      setLoading(false)
    }
  }

  const handleApple = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithApple()
      navigate(from, { replace: true })
    } catch (err) {
      // Apple-specific error cleanups
      let msg = (err.message || '').replace('Firebase: ', '')
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Apple sign-in is not enabled. Please use Google or email.'
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = '' // silent — user just closed the popup
      }
      if (msg) setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-apple-blue text-sm font-medium mb-8 hover:opacity-70 transition-opacity">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Welcome back</h1>
          <p className="text-apple-gray text-sm">Sign in to follow universities and get personalized alerts.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all duration-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-gray pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all duration-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-apple-blue hover:bg-blue-600 text-white px-8 py-3.5 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-apple-gray">or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-apple-dark px-8 py-3.5 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Apple Sign-In button */}
        <button
          onClick={handleApple}
          disabled={loading}
          className="w-full mt-3 bg-black hover:bg-gray-900 text-white px-8 py-3.5 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Continue with Apple
        </button>

        <p className="text-center text-sm text-apple-gray mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-apple-blue font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
