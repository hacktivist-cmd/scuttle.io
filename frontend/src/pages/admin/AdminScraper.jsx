import { useState } from 'react'
import { Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AdminScraper() {
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState(null)

  const trigger = async () => {
    setRunning(true)
    setStatus(null)
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API}/api/v1/trigger-scrape`, { method: 'POST' })
      if (res.ok) setStatus('success')
      else setStatus('error')
    } catch {
      setStatus('error')
    } finally {
      setRunning(false)
      setTimeout(() => setStatus(null), 5000)
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1">Scraper Control</h1>
      <p className="text-apple-gray text-sm mb-8">
        Manually trigger the scraper to check all institutions for new announcements.
      </p>

      <div className="bg-white rounded-2xl p-5 sm:p-6 md:p-8 border border-gray-100 shadow-apple">
        <div className="flex items-start gap-5 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Zap size={24} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-1">Run Scraper Now</h2>
            <p className="text-sm text-apple-gray leading-relaxed">
              Dispatches a Celery job to scrape all 200+ tracked institutions. Automatically runs every
              2-12 hours depending on admission season. Only scrapes institutions that are "due" based
              on their custom interval.
            </p>
          </div>
        </div>

        {status === 'success' && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">
              Scrape job dispatched. Watch the Celery worker logs for progress.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              Failed to dispatch. Make sure the backend is running.
            </p>
          </div>
        )}

        <button
          onClick={trigger}
          disabled={running}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3.5 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
        >
          {running ? (
            <><Loader2 size={18} className="animate-spin" /> Dispatching...</>
          ) : (
            <><Zap size={18} /> Trigger Scrape Now</>
          )}
        </button>
      </div>
    </div>
  )
}
