import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ScrollProgressBar from './ScrollProgressBar'
import ScrollTopButton from './ScrollTopButton'
import InstallPrompt from './InstallPrompt'
import NotificationPrompt from './NotificationPrompt'
import { useBadgeReset } from '../hooks/useBadgeReset'

export default function Layout() {
  useBadgeReset()

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollProgressBar />
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <ScrollTopButton />
      <InstallPrompt />
      <NotificationPrompt />
    </div>
  )
}
