import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, X, Users } from 'lucide-react'
import { shareApp } from '../lib/share'

/**
 * SharePrompt — appears once after user has engaged (3+ announcements viewed).
 * Fires only ONCE per device (persisted via localStorage).
 */
export default function SharePrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Already dismissed or shared before?
    if (localStorage.getItem('scuttle_share_prompted') === 'true') return

    // Check engagement
    const viewed = parseInt(localStorage.getItem('scuttle_viewed_count') || '0', 10)
    if (viewed < 3) return

    // Wait a bit after they hit 3, then show
    const timer = setTimeout(() => setVisible(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  const handleShare = async () => {
    localStorage.setItem('scuttle_share_prompted', 'true')
    setVisible(false)
    await shareApp()
  }

  const handleDismiss = () => {
    localStorage.setItem('scuttle_share_prompted', 'true')
    setVisible(false)
  }

  return (
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                <Users size={22} className="text-white" />
              </div>
              <div className="pr-6">
                <p className="font-semibold text-sm">Know someone applying?</p>
                <p className="text-xs text-apple-gray leading-relaxed mt-0.5">
                  Share Scuttle.io — help a friend never miss an admission update.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 bg-apple-blue hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-md"
              >
                <Share2 size={15} />
                Share
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
  )
}
