import { useState } from 'react'
import { AlertCircle, Check } from 'lucide-react'
import RevealWrapper from '../components/RevealWrapper'

export default function Report() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    e.target.reset()
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="max-w-2xl w-full mx-auto px-6 py-12">
      <RevealWrapper>
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mb-4">
            <AlertCircle size={26} />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">Report an Issue</h1>
          <p className="text-apple-gray text-lg">
            Help us improve Scuttle.io by reporting bugs, incorrect data, or missing institutions.
          </p>
        </div>
      </RevealWrapper>

      <RevealWrapper delay={100}>
        <div className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                Issue Type
              </label>
              <select
                required
                defaultValue=""
                className="w-full px-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all duration-300 cursor-pointer"
              >
                <option value="" disabled>
                  Select an issue type
                </option>
                <option value="bug">Broken link or bug</option>
                <option value="data">Incorrect or missing data</option>
                <option value="institution">Request a new institution</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                Page URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://scuttle.io/..."
                className="w-full px-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                required
                rows="5"
                placeholder="Please describe the issue in detail..."
                className="w-full px-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all duration-300 resize-none"
              />
            </div>
            <button
              type="submit"
              className={`w-full px-8 py-4 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-md hover:shadow-lg ${
                sent ? 'bg-green-600 text-white' : 'bg-apple-dark hover:bg-black text-white'
              }`}
            >
              {sent ? (
                <span className="flex items-center justify-center gap-2">
                  <Check size={18} /> Report Submitted!
                </span>
              ) : (
                'Submit Report'
              )}
            </button>
          </form>
        </div>
      </RevealWrapper>
    </div>
  )
}
