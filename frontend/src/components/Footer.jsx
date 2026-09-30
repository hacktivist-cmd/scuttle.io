import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import RevealWrapper from './RevealWrapper'

const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)
const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)
const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false)

  const quickLinks = [
    { label: 'All Universities', to: '/universities' },
    { label: 'JAMB CAPS Tracker', to: '/jamb-caps' },
    { label: 'Post-UTME Updates', to: '/post-utme' },
    { label: 'Admission Lists', to: '/admissions' },
    { label: 'School Fees Breakdown', to: '/fees' },
  ]

  const supportLinks = [
    { label: 'Help Center', to: '/help' },
    { label: 'Contact Us', to: '/contact' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Report an Issue', to: '/report' },
  ]

  return (
    <footer className="bg-apple-footer border-t border-gray-200/50 pt-16 pb-8 mt-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <RevealWrapper>
            <div className="space-y-4">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-white border border-gray-200/70 flex items-center justify-center shadow-sm">
                  <img src="/logo.png" alt="Scuttle.io" className="w-full h-full object-contain p-0.5" />
                </div>
                <h1 className="text-lg font-semibold tracking-tight">Scuttle.io</h1>
              </Link>
              <p className="text-apple-gray text-sm leading-relaxed">
                Empowering Nigerian students with real-time public admissions intelligence. Automatically tracking 200+ institutions so you never miss an update.
              </p>
              <div className="flex items-center gap-4 pt-2">
                {[TwitterIcon, InstagramIcon, LinkedinIcon].map((Icon, i) => (
                  <a key={i} href="#" className="text-apple-gray hover:text-apple-blue transition-all duration-300 hover:-translate-y-1">
                    <Icon width={18} height={18} />
                  </a>
                ))}
              </div>
            </div>
          </RevealWrapper>

          <RevealWrapper delay={100}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-3 text-sm text-apple-gray">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-apple-blue transition-all duration-300 hover:translate-x-1 inline-block">{link.label}</Link>
                </li>
              ))}
            </ul>
          </RevealWrapper>

          <RevealWrapper delay={200}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3 text-sm text-apple-gray">
              {supportLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-apple-blue transition-all duration-300 hover:translate-x-1 inline-block">{link.label}</Link>
                </li>
              ))}
            </ul>
          </RevealWrapper>

          <RevealWrapper delay={300}>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Stay Updated</h3>
            <p className="text-apple-gray text-sm mb-4">Get the latest admission alerts directly in your inbox.</p>
            <form onSubmit={(e) => { e.preventDefault(); setSubscribed(true) }} className="flex flex-col space-y-3">
              <input type="email" required placeholder="Enter your email" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue transition-all duration-300 hover:border-gray-300" />
              <button type="submit" className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 ${subscribed ? 'bg-green-600 text-white' : 'bg-apple-dark hover:bg-black text-white'}`}>
                {subscribed ? (<span className="flex items-center justify-center gap-1.5"><Check size={16} /> Subscribed!</span>) : ('Subscribe')}
              </button>
            </form>
          </RevealWrapper>
        </div>

        <div className="pt-8 border-t border-gray-200/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-apple-gray text-center md:text-left">&copy; 2026 Scuttle.io Engine. All rights reserved.copy; Scuttle.io 2026 &copy; 2026 Scuttle.io Engine. All rights reserved.middot; DARKGRID_AUTOMATION</p>
          <div className="flex items-center gap-6 text-xs text-apple-gray">
            <span>Built by HACKTIVIST</span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1.5">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-green-500 opacity-75 animate-ping-dot" />
                <span className="relative rounded-full w-2 h-2 bg-green-500" />
              </span>
              Engine Online
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
