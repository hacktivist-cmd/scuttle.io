import { useEffect, useRef, useState } from 'react'
import { Sparkles, ChevronDown } from 'lucide-react'

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = performance.now()
          const duration = 1800
          const animate = (now) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(target * eased))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  )
}

export default function Hero() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => setOffset(Math.min(window.scrollY * 0.35, 400))
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section className="relative w-full rounded-[2.5rem] overflow-hidden shadow-apple bg-gradient-to-br from-gray-900 via-slate-800 to-black min-h-[550px] md:min-h-[680px] flex items-center justify-center">
      <img
        src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
        alt="Nigerian University Campus"
        className="absolute inset-0 w-full h-full object-cover object-center animate-hero-image-in opacity-80"
        loading="eager"
        style={{ transform: `translateY(${offset}px) scale(${1 + offset * 0.0002})` }}
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src =
            'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop'
        }}
      />
      {/* HERO_BACKDROP_V1 — decorative layers */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />

      {/* Radial glow accents */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 20% 20%, rgba(0,113,227,0.25), transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 70%, rgba(147,51,234,0.20), transparent 70%),
            radial-gradient(ellipse 40% 30% at 50% 100%, rgba(251,146,60,0.15), transparent 70%)
          `,
        }}
      />

      {/* Dot-grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 80% 80% at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at center, black 30%, transparent 80%)',
        }}
      />

      {/* Top edge shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-8">
        <span
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full tracking-wide uppercase opacity-0 animate-hero-reveal"
          style={{ animationDelay: '0.1s' }}
        >
          <Sparkles size={14} /> The Future of Admissions
        </span>

        <h2
          className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-tight text-white opacity-0 animate-hero-reveal"
          style={{ animationDelay: '0.25s' }}
        >
          Live updates for{' '}
          <br className="hidden md:block" />
          <span className="shimmer-text">Nigerian students.</span>
        </h2>

        <p
          className="text-gray-200 text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed opacity-0 animate-hero-reveal"
          style={{ animationDelay: '0.4s' }}
        >
          Never miss a Post-UTME screening, admission list, or JAMB CAPS update again.
          Automatically aggregated from over 200 Federal, State, and Private institutions.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 opacity-0 animate-hero-reveal"
          style={{ animationDelay: '0.55s' }}
        >
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 px-8 py-4 rounded-2xl shadow-glass flex items-center gap-4 w-full sm:w-auto transition-all duration-500 hover:bg-white/15 hover:scale-[1.03] hover:-translate-y-1">
            <span className="text-4xl font-semibold text-white">
              <AnimatedCounter target={200} suffix="+" />
            </span>
            <span className="text-xs text-gray-300 text-left leading-tight font-medium">
              Tracked
              <br />
              Institutions
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 px-8 py-4 rounded-2xl shadow-glass flex items-center gap-4 w-full sm:w-auto transition-all duration-500 hover:bg-white/15 hover:scale-[1.03] hover:-translate-y-1">
            <span className="text-4xl font-semibold text-white">24/7</span>
            <span className="text-xs text-gray-300 text-left leading-tight font-medium">
              Automated
              <br />
              Monitoring
            </span>
          </div>
        </div>

        <div
          className="pt-4 opacity-0 animate-hero-reveal"
          style={{ animationDelay: '0.7s' }}
        >
          <ChevronDown size={24} className="mx-auto text-white/60 animate-bounce" />
        </div>
      </div>
    </section>
  )
}
