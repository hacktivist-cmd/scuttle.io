import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, Loader2, Check, AlertCircle, Shield } from 'lucide-react'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { useAuth } from '../contexts/AuthContext'
import { friendlyAuthError } from '../lib/authErrors'

export default function ChangePassword() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.email) {
      setToast({ type: 'error', msg: 'You must be signed in with email' })
      return
    }
    if (newPw.length < 6) {
      setToast({ type: 'error', msg: 'New password must be at least 6 characters' })
      return
    }
    if (newPw !== confirmPw) {
      setToast({ type: 'error', msg: "Passwords don't match" })
      return
    }

    setLoading(true)
    try {
      // Re-authenticate first (required by Firebase)
      const cred = EmailAuthProvider.credential(user.email, currentPw)
      await reauthenticateWithCredential(user, cred)
      // Update password
      await updatePassword(user, newPw)

      setToast({ type: 'success', msg: 'Password updated' })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => { setOpen(false); setToast(null) }, 1500)
    } catch (err) {
      setToast({ type: 'error', msg: friendlyAuthError(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Lock size={20} className="text-apple-blue" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Password & Security</h2>
          <p className="text-sm text-apple-gray mb-4">
            Update your password to keep your account secure.
          </p>

          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="bg-apple-dark hover:bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Shield size={15} />
              Change Password
            </button>
          ) : (
            <AnimatePresence>
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleSubmit}
                className="space-y-3"
              >
                {[
                  { label: 'Current password', value: currentPw, set: setCurrentPw },
                  { label: 'New password (min 6 chars)', value: newPw, set: setNewPw },
                  { label: 'Confirm new password', value: confirmPw, set: setConfirmPw },
                ].map(({ label, value, set }, i) => (
                  <div key={i}>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5">
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        required
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        className="w-full px-4 py-3 pr-11 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        tabIndex={-1}
                      >
                        {showPw ? <EyeOff size={15} className="text-apple-gray" /> : <Eye size={15} className="text-apple-gray" />}
                      </button>
                    </div>
                  </div>
                ))}

                {toast && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                    toast.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {toast.type === 'error' ? <AlertCircle size={15} /> : <Check size={15} />}
                    {toast.msg}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-apple-blue hover:bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setToast(null) }}
                    className="bg-gray-100 hover:bg-gray-200 text-apple-dark px-6 py-3 rounded-xl text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.form>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
