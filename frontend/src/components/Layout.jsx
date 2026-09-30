import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ScrollProgressBar from './ScrollProgressBar'
import ScrollTopButton from './ScrollTopButton'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollProgressBar />
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <ScrollTopButton />
    </div>
  )
}
