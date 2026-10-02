import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, AlertTriangle, Loader2, X, Shield } from 'lucide-react'
import { getAuth, deleteUser } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function DeleteAccountSection() {
  const { user, logOut } = useAuth()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [typedConfirm, setTypedConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const CONFIRM_PHRASE = 'DELETE'

  const handleDelete = async () => {
    if (typedConfirm !== CONFIRM_PHRASE) {
      setError(`Please type "${CONFIRM_PHRASE}" to confirm.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error('Not signed in')

      const token = await currentUser.getIdToken(true)

      // Call backend to delete Firestore doc + Auth user
      const res = await fetch(`${API}/api/v1/user/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Delete failed (${res.status})`)
      }

      // Try client-side sign out
      try {
        await logOut()
      } catch {
        // Firebase user was already deleted server-side — ignore
      }

      // Redirect home
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to delete account')
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-apple border border-red-100 mb-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
          <Trash2 size={20} className="text-red-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-red-700">Delete Account</h2>
          <p className="text-sm text-apple-gray">
            Permanently remove your account and all associated data. This cannot be undone.
          </p>
        </div>
      </div>

      <button
        onClick={() => setConfirming(true)}
        className="bg-white border-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
      >
        <Trash2 size={15} />
        Delete my account
      </button>

      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => !loading && setConfirming(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={26} className="text-red-600" />
                </div>
                <button
                  onClick={() => !loading && setConfirming(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={18} className="text-apple-gray" />
                </button>
              </div>

              <h3 className="font-semibold text-xl mb-2 text-red-700">
                Delete your account?
              </h3>
              <p className="text-sm text-apple-gray leading-relaxed mb-5">
                This will permanently delete:
              </p>

              <ul className="text-sm text-apple-gray space-y-2 mb-5 pl-5 list-disc">
                <li>Your account and profile</li>
                <li>All your followed universities and interests</li>
                <li>Push notification tokens</li>
                <li>Email subscriptions</li>
                <li>All associated data</li>
              </ul>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-2">
                  <Shield size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    This action is <strong>irreversible</strong>. You can always create a new account later, but your data cannot be recovered.
                  </p>
                </div>
              </div>

              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-apple-dark">
                Type "{CONFIRM_PHRASE}" to confirm
              </label>
              <input
                type="text"
                value={typedConfirm}
                onChange={(e) => { setTypedConfirm(e.target.value.toUpperCase()); setError('') }}
                placeholder={CONFIRM_PHRASE}
                disabled={loading}
                className="w-full px-4 py-3 bg-apple-bg border-2 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white text-sm font-mono tracking-widest transition-all"
              />

              {error && (
                <p className="mt-2 text-xs text-red-600">{error}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirming(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-apple-dark py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading || typedConfirm !== CONFIRM_PHRASE}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} /> Delete Forever
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
