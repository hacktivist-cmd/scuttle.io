import { useEffect, useState } from 'react'

export default function ScrollProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0
      setProgress(scrolled)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[9999] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-apple-blue to-blue-400 transition-[width] duration-100 linear shadow-[0_0_10px_rgba(0,113,227,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
