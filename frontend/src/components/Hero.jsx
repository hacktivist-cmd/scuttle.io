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
      {/* HERO_BACKDROP_V2 — visible glow, pattern, and corner accents */}

      {/* Strong radial glows — colored light beams */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 55% 45% at 15% 25%, rgba(59,130,246,0.45), transparent 65%),
            radial-gradient(ellipse 50% 40% at 85% 75%, rgba(168,85,247,0.35), transparent 65%),
            radial-gradient(ellipse 45% 35% at 50% 105%, rgba(251,146,60,0.30), transparent 65%),
            radial-gradient(ellipse 40% 30% at 50% -5%, rgba(16,185,129,0.20), transparent 65%)
          `,
        }}
      />

      {/* Academic dot grid — subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Diagonal accent stripes — bottom-left corner */}
      <div
        className="absolute bottom-0 left-0 w-1/3 h-1/3 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 12px)',
          maskImage: 'linear-gradient(45deg, black, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(45deg, black, transparent 80%)',
        }}
      />

      {/* Corner brackets — premium frame feel */}
      <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-white/30 rounded-tl-2xl pointer-events-none" />
      <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-white/30 rounded-tr-2xl pointer-events-none" />
      <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-white/30 rounded-bl-2xl pointer-events-none" />
      <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-white/30 rounded-br-2xl pointer-events-none" />

      {/* Animated top shimmer bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none overflow-hidden rounded-t-[2.5rem]">
        <div
          className="h-full w-full animate-shimmer"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), rgba(59,130,246,0.9), rgba(168,85,247,0.7), transparent)',
            backgroundSize: '200% 100%',
          }}
        />
      </div>

      {/* Bottom vignette for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

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
