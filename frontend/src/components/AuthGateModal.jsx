import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Lock, X, Sparkles } from 'lucide-react'

export default function AuthGateModal({ open, onClose, reason = 'continue' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="relative bg-white rounded-[2rem] shadow-modal w-full max-w-md p-8 z-10 text-center"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-all duration-300 hover:rotate-90"
              aria-label="Close"
            >
              <X size={18} className="text-apple-gray" />
            </button>

            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
              <Lock size={28} className="text-white" />
            </div>

            <h2 className="text-2xl font-semibold tracking-tight mb-2">
              Sign in to {reason}
            </h2>

            <p className="text-apple-gray text-sm leading-relaxed mb-6">
              Create a free account to read full notices, follow universities, and get
              personalized admission alerts.
            </p>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 text-left space-y-2">
              <p className="text-xs text-apple-blue font-medium flex items-center gap-2">
                <Sparkles size={14} /> Free forever
              </p>
              <p className="text-xs text-apple-blue font-medium flex items-center gap-2">
                <Sparkles size={14} /> Follow specific universities
              </p>
              <p className="text-xs text-apple-blue font-medium flex items-center gap-2">
                <Sparkles size={14} /> Personalized WhatsApp & email alerts
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/signup"
                onClick={onClose}
                className="bg-apple-blue hover:bg-blue-600 text-white px-6 py-3.5 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-md hover:shadow-lg"
              >
                Create Free Account
              </Link>
              <Link
                to="/signin"
                onClick={onClose}
                className="bg-gray-50 hover:bg-gray-100 text-apple-dark px-6 py-3.5 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5"
              >
                I already have an account
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
