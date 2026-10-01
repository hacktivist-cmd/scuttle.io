import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'

import Home from './pages/Home'
import Universities from './pages/Universities'
import JambCaps from './pages/JambCaps'
import PostUtme from './pages/PostUtme'
import Admissions from './pages/Admissions'
import Fees from './pages/Fees'
import Help from './pages/Help'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Report from './pages/Report'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Profile from './pages/Profile'

import AdminLogin from './pages/admin/AdminLogin'
import AdminHome from './pages/admin/AdminHome'
import AdminUsers from './pages/admin/AdminUsers'
import AdminNewsletter from './pages/admin/AdminNewsletter'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminScraper from './pages/admin/AdminScraper'

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* Main site */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/universities" element={<Universities />} />
          <Route path="/jamb-caps" element={<JambCaps />} />
          <Route path="/post-utme" element={<PostUtme />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/report" element={<Report />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Home />} />
        </Route>

        {/* Separate admin login (not protected) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin panel — completely separate */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="newsletter" element={<AdminNewsletter />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="scraper" element={<AdminScraper />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
