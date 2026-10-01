import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Mail, FileText, Zap, LogOut, ChevronLeft,
  Shield, Menu, X,
} from 'lucide-react'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { to: '/admin/announcements', label: 'Announcements', icon: FileText },
  { to: '/admin/scraper', label: 'Scraper', icon: Zap },
]

export default function AdminLayout() {
  const { profile, logOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Prevent body scroll when sidebar open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const handleLogout = async () => {
    await logOut()
    navigate('/')
  }

  const SidebarContent = (
    <>
      <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
            <Shield size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Scuttle Admin</p>
            <p className="text-[10px] text-apple-gray uppercase tracking-wider">Control Panel</p>
          </div>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} className="text-apple-gray" />
        </button>
      </div>

      <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-apple-gray hover:bg-gray-50 hover:text-apple-dark'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 md:p-4 border-t border-gray-100 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl text-sm font-medium text-apple-gray hover:bg-gray-50 transition-all"
        >
          <ChevronLeft size={18} />
          Back to Site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      <div className="px-3 md:px-4 pb-4">
        <div className="p-3 rounded-xl bg-apple-bg flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {profile?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{profile?.name || 'Admin'}</p>
            <p className="text-[10px] text-apple-gray truncate">{profile?.email}</p>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-apple-bg flex">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200/60 flex-col fixed h-screen z-30">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white flex flex-col shadow-2xl animate-[slideIn_0.2s_ease-out]">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-200/60 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-apple-dark" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold">Admin</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
