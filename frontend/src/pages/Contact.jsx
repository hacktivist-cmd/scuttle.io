import { useState } from 'react'
import { Mail, Phone, MapPin, Check } from 'lucide-react'
import RevealWrapper from '../components/RevealWrapper'

export default function Contact() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    e.target.reset()
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="max-w-3xl w-full mx-auto px-6 py-12">
      <RevealWrapper>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">Get in touch.</h1>
          <p className="text-apple-gray text-lg">
            We'd love to hear from you. Our team is here to help.
          </p>
        </div>
      </RevealWrapper>

      <RevealWrapper delay={100}>
        <div className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all duration-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                Subject
              </label>
              <input
                type="text"
                required
                placeholder="How can we help?"
                className="w-full px-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
                Message
              </label>
              <textarea
                required
                rows="5"
                placeholder="Your message here..."
                className="w-full px-4 py-3 bg-apple-bg border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:bg-white text-sm transition-all duration-300 resize-none"
              />
            </div>
            <button
              type="submit"
              className={`w-full px-8 py-4 rounded-xl font-medium transition-all duration-300 hover:-translate-y-0.5 shadow-md hover:shadow-lg ${
                sent ? 'bg-green-600 text-white' : 'bg-apple-blue hover:bg-blue-600 text-white'
              }`}
            >
              {sent ? (
                <span className="flex items-center justify-center gap-2">
                  <Check size={18} /> Message Sent!
                </span>
              ) : (
                'Send Message'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-apple-blue mb-3">
                <Mail size={18} />
              </div>
              <p className="text-xs text-apple-gray uppercase tracking-wider font-semibold mb-1">
                Email
              </p>
              <p className="text-sm font-medium">support@scuttle.io</p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-green-50 text-green-600 mb-3">
                <Phone size={18} />
              </div>
              <p className="text-xs text-apple-gray uppercase tracking-wider font-semibold mb-1">
                Phone
              </p>
              <p className="text-sm font-medium">+234 800 000 0000</p>
            </div>
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600 mb-3">
                <MapPin size={18} />
              </div>
              <p className="text-xs text-apple-gray uppercase tracking-wider font-semibold mb-1">
                Office
              </p>
              <p className="text-sm font-medium">Lagos, Nigeria</p>
            </div>
          </div>
        </div>
      </RevealWrapper>
    </div>
  )
}
