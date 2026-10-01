import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, BellRing, X, Smartphone, Share, PlusSquare } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  isPushSupported,
  isStandalonePWA,
  getPermissionState,
  enablePushNotifications,
  onForegroundMessage,
} from '../lib/pushNotifications'

export default function NotificationPrompt() {
  const { user, profile, refreshProfile } = useAuth()
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [foregroundToast, setForegroundToast] = useState(null)

  useEffect(() => {
    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(ios)

    if (!user || !isPushSupported()) return
    if (profile?.pushEnabled) return
    if (getPermissionState() === 'denied') return
    if (localStorage.getItem('scuttle_push_dismissed') === 'true') return

    // Show after 30s
    const timer = setTimeout(() => setVisible(true), 8000)
    return () => clearTimeout(timer)
  }, [user, profile])

  // Foreground message handler
  useEffect(() => {
    if (!profile?.pushEnabled) return
    const unsubscribe = onForegroundMessage((msg) => {
      setForegroundToast(msg)
      setTimeout(() => setForegroundToast(null), 5000)
    })
    return () => unsubscribe?.()
  }, [profile?.pushEnabled])

  const handleEnable = async () => {
    setError('')

    // iOS: user must install PWA first
    if (isIOS && !isStandalonePWA()) {
      setShowIOSInstructions(true)
      return
    }

    setLoading(true)
    try {
      await enablePushNotifications(user)
      await refreshProfile()
      setVisible(false)
    } catch (err) {
      setError(err.message || 'Failed to enable notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem('scuttle_push_dismissed', 'true')
  }

  if (!user || profile?.pushEnabled) {
    return foregroundToast ? (
      <ForegroundToast toast={foregroundToast} />
    ) : null
  }

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-24 sm:max-w-sm z-40"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 relative">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Dismiss"
              >
                <X size={14} className="text-apple-gray" />
              </button>

              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
                  <BellRing size={22} className="text-white" />
                </div>
                <div className="pr-6">
                  <p className="font-semibold text-sm">Enable Notifications</p>
                  <p className="text-xs text-apple-gray leading-relaxed mt-0.5">
                    Get pinged the moment your university posts an update. Free forever.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-3 p-2.5 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleEnable}
                  disabled={loading}
                  className="flex-1 bg-apple-blue hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-md disabled:opacity-50"
                >
                  <Bell size={15} />
                  {loading ? 'Enabling...' : 'Allow Notifications'}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-apple-gray hover:bg-gray-100 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS install instructions modal */}
      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowIOSInstructions(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] max-w-md w-full p-6"
            >
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-3">
                  <Smartphone size={26} className="text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Install Scuttle First</h3>
                <p className="text-sm text-apple-gray leading-relaxed">
                  iOS requires Scuttle to be on your home screen before notifications work.
                </p>
              </div>

              <div className="space-y-3 mb-5">
                <Step n={1} icon={Share} text="Tap the Share button in Safari" />
                <Step n={2} icon={PlusSquare} text="Scroll and tap 'Add to Home Screen'" />
                <Step n={3} icon={Bell} text="Open Scuttle from home screen, then tap Enable Notifications" />
              </div>

              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full bg-apple-blue hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {foregroundToast && <ForegroundToast toast={foregroundToast} />}
    </>
  )
}

function Step({ n, icon: Icon, text }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
      <div className="w-8 h-8 rounded-full bg-apple-blue text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
        {n}
      </div>
      <Icon size={16} className="text-apple-gray flex-shrink-0" />
      <span className="text-sm text-apple-dark">{text}</span>
    </div>
  )
}

function ForegroundToast({ toast }) {
  return (
    <motion.a
      href={toast.url}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-20 right-4 max-w-sm z-[80] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-start gap-3 hover:shadow-apple-hover transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        <BellRing size={18} className="text-apple-blue" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate">{toast.title}</p>
        <p className="text-xs text-apple-gray line-clamp-2">{toast.body}</p>
      </div>
    </motion.a>
  )
}
