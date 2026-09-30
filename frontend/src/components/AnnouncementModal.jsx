import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Lock } from 'lucide-react'
import { useReadTracking } from '../hooks/useReadTracking'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function AnnouncementModal({ item, onClose }) {
  const { markRead } = useReadTracking()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (item) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
      markRead(item.id)
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [item, onClose, markRead])

  const handleExternalClick = (e) => {
    if (!user) {
      e.preventDefault()
      onClose()
      navigate('/signin')
    }
  }

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="relative bg-white rounded-[2rem] shadow-modal w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10"
          >
            <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <div className="space-y-3 pr-4">
                <div className="flex flex-wrap gap-2">
                  <span className="bg-blue-50 text-apple-blue text-[11px] font-semibold px-3 py-1 rounded-full border border-blue-100 uppercase tracking-wide">
                    {item.institution_type || 'University'}
                  </span>
                  <span className="bg-gray-50 text-apple-gray text-[11px] font-medium px-3 py-1 rounded-full border border-gray-100">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-semibold text-xl md:text-2xl leading-snug">{item.title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-all duration-300 hover:rotate-90 flex-shrink-0"
                aria-label="Close"
              >
                <X size={18} className="text-apple-gray" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-grow space-y-6 bg-gray-50/30">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Summary</h4>
                <p className="text-apple-gray text-sm md:text-base leading-relaxed">
                  {item.summary || 'No summary provided.'}
                </p>
              </div>

              {item.pdf_extracted_text && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider">
                      Extracted Document Content
                    </h4>
                    <span className="text-[10px] text-apple-gray bg-gray-100 px-2 py-0.5 rounded-md">
                      Auto-parsed via Scuttle Engine
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl text-xs text-apple-gray font-mono whitespace-pre-wrap max-h-60 overflow-y-auto border border-gray-200 custom-scrollbar shadow-inner">
                    {item.pdf_extracted_text}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-apple-gray font-medium">
                Scraped: {new Date(item.date_scraped).toLocaleDateString()}
              </span>
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleExternalClick}
                className="w-full sm:w-auto bg-apple-blue hover:bg-blue-600 text-white px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                {user ? <ExternalLink size={16} /> : <Lock size={16} />}
                <span>{user ? 'Visit Original Source' : 'Sign in to Visit'}</span>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
