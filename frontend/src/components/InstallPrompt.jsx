import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Already installed?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    // User dismissed before?
    if (localStorage.getItem('scuttle_pwa_dismissed') === 'true') return

    // ENGAGEMENT_GATE — only show after user has viewed 2+ announcements
    const engagement = parseInt(localStorage.getItem('scuttle_viewed_count') || '0', 10)
    if (engagement < 2) return

    if (ios) {
      // iOS doesn't fire beforeinstallprompt — show after 15s
      setTimeout(() => setVisible(true), 15000)
      return
    }

    // Android/Chrome — wait for the native prompt
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setVisible(true), 15000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
      setInstalled(true)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem('scuttle_pwa_dismissed', 'true')
  }

  if (installed || !visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-40"
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
            <img
              src="/logo.png"
              alt="Scuttle.io"
              className="w-12 h-12 rounded-xl object-contain bg-apple-bg border border-gray-200 flex-shrink-0"
            />
            <div className="pr-6">
              <p className="font-semibold text-sm">Install Scuttle.io</p>
              <p className="text-xs text-apple-gray leading-relaxed mt-0.5">
                {isIOS
                  ? 'Add to your home screen for instant access.'
                  : 'Install the app for faster access and offline support.'}
              </p>
            </div>
          </div>

          {isIOS ? (
            // iOS instructions
            <div className="space-y-3 bg-blue-50 rounded-xl p-3 mb-3">
              <p className="text-xs font-semibold text-apple-blue mb-2">
                Follow these steps:
              </p>
              <div className="flex items-center gap-2 text-xs text-apple-dark">
                <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-apple-blue font-bold flex-shrink-0">1</span>
                Tap <Share size={14} className="inline mx-0.5" /> at the bottom
              </div>
              <div className="flex items-center gap-2 text-xs text-apple-dark">
                <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-apple-blue font-bold flex-shrink-0">2</span>
                Scroll and tap <PlusSquare size={14} className="inline mx-0.5" /> <strong>Add to Home Screen</strong>
              </div>
              <div className="flex items-center gap-2 text-xs text-apple-dark">
                <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-apple-blue font-bold flex-shrink-0">3</span>
                Tap <strong>Add</strong> at the top
              </div>
            </div>
          ) : (
            // Android native button
            <button
              onClick={handleInstall}
              className="w-full bg-apple-blue hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-md"
            >
              <Download size={15} />
              Install App
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
