import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Already installed?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // User dismissed before?
    if (localStorage.getItem('scuttle_pwa_dismissed') === 'true') return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setVisible(true), 15000) // Show after 15s
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
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} className="text-apple-gray" />
          </button>

          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-apple-blue to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <Smartphone size={22} className="text-white" />
            </div>
            <div className="pr-6">
              <p className="font-semibold text-sm">Install Scuttle.io</p>
              <p className="text-xs text-apple-gray leading-relaxed mt-0.5">
                Add to your home screen for instant access and push alerts.
              </p>
            </div>
          </div>

          <button
            onClick={handleInstall}
            className="w-full bg-apple-blue hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-md"
          >
            <Download size={15} />
            Install App
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
