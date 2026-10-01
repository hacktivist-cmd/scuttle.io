import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, MessageCircle, User, LogOut, Settings, ChevronDown, Shield } from 'lucide-react'
import LiveStatus from './LiveStatus'
import { useAuth } from '../contexts/AuthContext'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const { user, profile, isAdmin, logOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logOut()
    navigate('/')
  }

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-500 ease-out ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-gray-200/60 shadow-md'
          : 'bg-white/60 backdrop-blur-xl border-gray-200/40'
      }`}
    >
      <div
        className={`max-w-6xl mx-auto px-6 flex items-center justify-between transition-all duration-500 ${
          scrolled ? 'h-14' : 'h-16'
        }`}
      >
        <Link to="/" className="flex items-center space-x-3 group">
          <div
            className={`rounded-xl overflow-hidden bg-white border border-gray-200/70 flex items-center justify-center shadow-sm transition-all duration-500 group-hover:rotate-[6deg] group-hover:scale-105 ${
              scrolled ? 'w-8 h-8' : 'w-9 h-9'
            }`}
          >
            <img src="/logo.png" alt="Scuttle.io" className="w-full h-full object-contain p-0.5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Scuttle.io</h1>
        </Link>

        <div className="flex items-center space-x-3">
          <LiveStatus />

          <a
            href="https://whatsapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex group bg-apple-blue hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-sm items-center gap-1.5 hover:-translate-y-0.5 hover:scale-[1.03]"
          >
            <MessageCircle size={16} />
            <span className="hidden sm:inline">Join</span><span className="sm:hidden">Join</span>
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-full p-1 pr-3 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="w-7 h-7 rounded-full bg-apple-dark text-white flex items-center justify-center text-xs font-semibold overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (profile?.name || user.email)?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <ChevronDown
                  size={14}
                  className={`text-apple-gray transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-2xl shadow-modal border border-gray-100 py-2 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold truncate">{profile?.name || 'User'}</p>
                    <p className="text-xs text-apple-gray truncate">{user.email}</p>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        <Shield size={10} /> ADMIN
                      </span>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={16} className="text-apple-gray" />
                    My Profile & Interests
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-purple-700"
                    >
                      <Shield size={16} />
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 transition-colors border-t border-gray-100"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/signin"
              className="flex items-center gap-1.5 bg-apple-dark hover:bg-black text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03]"
            >
              <User size={15} />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
