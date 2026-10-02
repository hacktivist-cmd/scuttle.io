import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ExternalLink, Calendar, Lock, Loader2,
  AlertCircle, Sparkles,
} from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useSEO } from '../hooks/useSEO'
import UniversityLogo from '../components/UniversityLogo'
import ShareButtons from '../components/ShareButtons'
import { matchUniversity } from '../lib/matchUniversity'
import { useAnnouncements } from '../hooks/useAnnouncements'

const APP_ID = 'scuttle-io-default'

export default function NoticePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { announcements } = useAnnouncements()

  const [item, setItem] = useState(null)
  const [status, setStatus] = useState('loading') // loading | found | notfound
  const [error, setError] = useState('')

  // 1. Try to find in already-loaded announcements (instant)
  useEffect(() => {
    if (!id || announcements.length === 0) return
    const found = announcements.find((a) => a.id === id || a.slug_hash === id)
    if (found) {
      setItem(found)
      setStatus('found')
    }
  }, [id, announcements])

  // 2. Fallback: fetch directly from Firestore
  useEffect(() => {
    if (status === 'found' || !id || !db) return

    let cancelled = false

    const fetchNotice = async () => {
      try {
        const ref = doc(db, 'artifacts', APP_ID, 'public', 'data', 'announcements', id)
        const snap = await getDoc(ref)
        if (cancelled) return

        if (snap.exists()) {
          setItem({ id: snap.id, ...snap.data() })
          setStatus('found')
        } else {
          setStatus('notfound')
        }
      } catch (err) {
        if (cancelled) return
        console.error('NoticePage fetch failed:', err)
        setError(err.message || 'Failed to load notice')
        setStatus('notfound')
      }
    }

    // Wait 800ms for `announcements` to load first
    const timer = setTimeout(fetchNotice, 800)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [id, status])

  useSEO({
    title: item?.title ? `${item.title.slice(0, 60)} — ${item.university_name || 'Scuttle'}` : 'Notice',
    description: item?.summary || 'Nigerian university admission update.',
    canonical: item ? `https://scuttle.io/notice/${id}` : undefined,
  })

  const university = item
    ? matchUniversity(item) || {
        name: item.university_name,
        code: item.university_code || 'UNI',
      }
    : null

  const handleSourceClick = (e) => {
    if (!user) {
      e.preventDefault()
      navigate('/signin', { state: { from: `/notice/${id}` } })
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="max-w-2xl w-full mx-auto px-6 py-16 flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-apple-blue" />
        <p className="text-sm text-apple-gray font-medium">Loading notice...</p>
      </div>
    )
  }

  // Not found
  if (status === 'notfound' || !item) {
    return (
      <div className="max-w-xl w-full mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-4">
          <AlertCircle size={28} className="text-amber-600" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Notice not found</h1>
        <p className="text-apple-gray text-sm mb-6">
          {error || "This notice may have been removed, or the link is broken."}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-apple-blue hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
    )
  }

  // Main view
  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-8 md:py-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-apple-blue text-sm font-medium mb-6 hover:opacity-70 transition-opacity"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-[2rem] shadow-apple border border-gray-100 overflow-hidden"
      >
        {/* Hero image */}
        {item.image_url && (
          <div className="w-full h-56 md:h-72 bg-gray-100 overflow-hidden">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="eager"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 md:p-10">
          {/* University header */}
          <div className="flex items-center gap-3 mb-4">
            <UniversityLogo university={university} size={44} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-apple-dark truncate">
                {item.university_name}
              </p>
              <p className="text-[10px] text-apple-gray uppercase tracking-wider">
                {item.institution_type || 'University'}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="bg-blue-50 text-apple-blue text-[11px] font-semibold px-3 py-1 rounded-full border border-blue-100">
              {item.category}
            </span>
            {item.date_scraped && (
              <span className="text-xs text-apple-gray flex items-center gap-1.5">
                <Calendar size={12} />
                {new Date(item.date_scraped).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-semibold leading-tight mb-5">
            {item.title}
          </h1>

          {/* Summary */}
          {item.summary && (
            <p className="text-apple-gray text-base leading-relaxed mb-6">
              {item.summary}
            </p>
          )}

          {/* Extracted PDF text */}
          {item.pdf_extracted_text && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider">
                  Document Content
                </h2>
                <span className="text-[10px] text-apple-gray bg-gray-100 px-2 py-0.5 rounded-md">
                  Auto-parsed
                </span>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 text-xs text-apple-gray font-mono whitespace-pre-wrap max-h-72 overflow-y-auto border border-gray-100 custom-scrollbar">
                {item.pdf_extracted_text}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <ShareButtons item={item} />
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSourceClick}
              className="w-full sm:w-auto bg-apple-blue hover:bg-blue-600 text-white px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              {user ? <ExternalLink size={15} /> : <Lock size={15} />}
              {user ? 'Visit Original Source' : 'Sign in to Visit'}
            </a>
          </div>

          {/* CTA — promote app to new visitors */}
          <div className="mt-6 pt-6 border-t border-gray-100 bg-blue-50/60 -mx-6 md:-mx-10 -mb-6 md:-mb-10 px-6 md:px-10 py-5 md:py-6 rounded-b-[2rem]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-apple-blue flex items-center justify-center flex-shrink-0">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-apple-dark">
                  Track all Nigerian university updates
                </p>
                <p className="text-xs text-apple-gray">
                  Free forever. Get push alerts the moment your school posts.
                </p>
              </div>
              <Link
                to="/signup"
                className="flex-shrink-0 bg-apple-blue hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  )
}
