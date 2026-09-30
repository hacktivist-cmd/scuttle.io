import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Mail, FileText, Zap, LogOut, ChevronLeft, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/newsletter', label: 'Newsletter', icon: Mail },
  { to: '/admin/announcements', label: 'Announcements', icon: FileText },
  { to: '/admin/scraper', label: 'Scraper Control', icon: Zap },
]

export default function AdminLayout() {
  const { profile, logOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-apple-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200/60 flex flex-col fixed h-screen">
        <div className="p-6 border-b border-gray-100">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Scuttle Admin</p>
              <p className="text-[10px] text-apple-gray uppercase tracking-wider">Control Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-apple-gray hover:bg-gray-50 hover:text-apple-dark'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-apple-gray hover:bg-gray-50 transition-all"
          >
            <ChevronLeft size={17} />
            Back to Site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>

        <div className="px-4 pb-4">
          <div className="p-3 rounded-xl bg-apple-bg flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold">
              {profile?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{profile?.name || 'Admin'}</p>
              <p className="text-[10px] text-apple-gray truncate">{profile?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64">
        <Outlet />
      </main>
    </div>
  )
}
