import { useState, useEffect } from 'react'
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Mail, FileText, Zap, LogOut, ChevronLeft,
  Shield, Menu, X, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
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

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    // Persist collapsed state across reloads
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem('admin_sidebar_collapsed', String(collapsed))
    } catch {}
  }, [collapsed])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Lock body scroll on mobile drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    await logOut()
    navigate('/')
  }

  // ── Shared nav content (used by both desktop + mobile) ──
  const NavContent = ({ isCollapsed }) => (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {navItems.map(({ to, label, icon: Icon, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          title={isCollapsed ? label : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-3 md:py-2.5'
            } ${
              isActive
                ? 'bg-purple-50 text-purple-700'
                : 'text-apple-gray hover:bg-gray-50 hover:text-apple-dark'
            }`
          }
        >
          <Icon size={18} className="flex-shrink-0" />
          {!isCollapsed && <span>{label}</span>}
        </NavLink>
      ))}
    </nav>
  )

  const SidebarHeader = ({ isCollapsed, onClose }) => (
    <div
      className={`p-3 md:p-4 border-b border-gray-100 flex items-center ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}
    >
      <Link to="/admin" className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Scuttle Admin</p>
            <p className="text-[10px] text-apple-gray uppercase tracking-wider">Control Panel</p>
          </div>
        )}
      </Link>
      {!isCollapsed && onClose && (
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} className="text-apple-gray" />
        </button>
      )}
    </div>
  )

  const SidebarFooter = ({ isCollapsed }) => (
    <>
      <div className="p-3 border-t border-gray-100 space-y-1">
        <Link
          to="/"
          title={isCollapsed ? 'Back to Site' : undefined}
          className={`flex items-center gap-3 rounded-xl text-sm font-medium text-apple-gray hover:bg-gray-50 transition-all ${
            isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-3 md:py-2.5'
          }`}
        >
          <ChevronLeft size={18} className="flex-shrink-0" />
          {!isCollapsed && <span>Back to Site</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center gap-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all ${
            isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-3 md:py-2.5'
          }`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>

      <div className={`px-3 pb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <div
            title={`${profile?.name || 'Admin'} — ${profile?.email}`}
            className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold"
          >
            {profile?.name?.[0]?.toUpperCase() || 'A'}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-apple-bg flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {profile?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{profile?.name || 'Admin'}</p>
              <p className="text-[10px] text-apple-gray truncate">{profile?.email}</p>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-apple-bg flex">

      {/* ── Desktop sidebar ── */}
      <aside
        className={`hidden md:flex bg-white border-r border-gray-200/60 flex-col fixed h-screen z-30 transition-[width] duration-300 ease-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarHeader isCollapsed={collapsed} />
        <NavContent isCollapsed={collapsed} />
        <SidebarFooter isCollapsed={collapsed} />

        {/* Collapse toggle — sits on the right edge */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-apple-gray hover:text-purple-600 hover:border-purple-200 transition-colors z-40"
        >
          {collapsed ? <PanelLeftOpen size={12} /> : <PanelLeftClose size={12} />}
        </button>
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white flex flex-col shadow-2xl animate-[slideIn_0.2s_ease-out]">
            <SidebarHeader isCollapsed={false} onClose={() => setMobileOpen(false)} />
            <NavContent isCollapsed={false} />
            <SidebarFooter isCollapsed={false} />
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ease-out ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-20 bg-white border-b border-gray-200/60 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
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
