import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Award-winning animated splash screen — white canvas edition.
 * Features:
 * - Ambient drifting gradient orbs (live motion, not just entrance)
 * - Floating particle field
 * - Concentric ripples expanding on loop
 * - Orbiting dots around the logo
 * - Letter-by-letter brand reveal
 * - Live loading bar with continuous shimmer
 * - Percentage counter that feels like a real boot sequence
 * - Graceful fade + blur exit
 */
export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(0)

  // Generate particle field once
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 3,
        duration: 6 + Math.random() * 6,
        hue: ['#0071E3', '#9333EA', '#06B6D4', '#F59E0B'][i % 4],
      })),
    []
  )

  useEffect(() => {
    // Accessibility
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setVisible(false)
      onComplete?.()
      return
    }

    // ─── PROGRESS COUNTER ───
    // Start AFTER the wrapper animates in (2.2s), so users actually
    // see the bar fill 0 → 100. Previously it started at mount (0s),
    // so by the time the wrapper appeared, it was already at ~81%.
    let progressTimer
    const progressStartDelay = 2200  // when the counter starts
    const progressDuration = 1800    // how long to reach 100%

    const startProgress = setTimeout(() => {
      const startTime = Date.now()
      progressTimer = setInterval(() => {
        const elapsed = Date.now() - startTime
        const p = Math.min(100, Math.floor((elapsed / progressDuration) * 100))
        setProgress(p)
        if (p >= 100) clearInterval(progressTimer)
      }, 30)
    }, progressStartDelay)

    // ─── DISMISS ───
    // Give the whole sequence room to breathe:
    //   0.0s   mount
    //   0.2s   orbs start blooming
    //   0.4s   ripples start looping
    //   0.5s   logo springs in
    //   0.8s   orbits start
    //   1.2s   brand letters reveal
    //   1.8s   tagline fades in
    //   2.2s   progress wrapper appears + counter starts
    //   4.0s   progress reaches 100%
    //   4.3s   dismiss triggers (fade + blur + scale)
    //   5.2s   fully gone
    const dismissTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onComplete?.(), 900)
    }, 4300)

    return () => {
      clearTimeout(startProgress)
      clearInterval(progressTimer)
      clearTimeout(dismissTimer)
    }
  }, [onComplete])

  const brandLetters = 'Scuttle.io'.split('')

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.08 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white"
        >

          {/* ═══════════════════════════════════════
              AMBIENT LAYER 1 — Drifting gradient orbs
              ═══════════════════════════════════════ */}

          {/* Blue orb — top left */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 0.55, scale: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute pointer-events-none splash-orb-1"
            style={{
              width: '55vmax',
              height: '55vmax',
              top: '-22%',
              left: '-18%',
              background: 'radial-gradient(circle, rgba(0,113,227,0.28) 0%, rgba(0,113,227,0) 65%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Purple orb — bottom right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 0.48, scale: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            className="absolute pointer-events-none splash-orb-2"
            style={{
              width: '50vmax',
              height: '50vmax',
              bottom: '-22%',
              right: '-18%',
              background: 'radial-gradient(circle, rgba(147,51,234,0.24) 0%, rgba(147,51,234,0) 65%)',
              filter: 'blur(40px)',
            }}
          />

          {/* Cyan orb — center accent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.28, scale: 1 }}
            transition={{ duration: 2.0, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="absolute pointer-events-none splash-orb-3"
            style={{
              width: '40vmax',
              height: '40vmax',
              top: '30%',
              left: '40%',
              background: 'radial-gradient(circle, rgba(6,182,212,0.20) 0%, rgba(6,182,212,0) 70%)',
              filter: 'blur(50px)',
            }}
          />

          {/* ═══════════════════════════════════════
              AMBIENT LAYER 2 — Dot grid
              ═══════════════════════════════════════ */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(0,113,227,0.14) 1px, transparent 1.5px)',
              backgroundSize: '32px 32px',
              maskImage: 'radial-gradient(ellipse 65% 65% at center, black 15%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse 65% 65% at center, black 15%, transparent 75%)',
            }}
          />

          {/* ═══════════════════════════════════════
              AMBIENT LAYER 3 — Floating particle field
              ═══════════════════════════════════════ */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <span
                key={p.id}
                className="absolute rounded-full splash-particle"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  background: p.hue,
                  opacity: 0.35,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  boxShadow: `0 0 ${p.size * 2}px ${p.hue}55`,
                }}
              />
            ))}
          </div>

          {/* ═══════════════════════════════════════
              AMBIENT LAYER 4 — Top gradient line
              ═══════════════════════════════════════ */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="absolute top-0 left-0 right-0 h-[2px] origin-center"
            style={{
              background: 'linear-gradient(90deg, transparent, #0071E3, #9333EA, #06B6D4, transparent)',
              backgroundSize: '200% 100%',
              animation: 'splash-shimmer-line 3s linear infinite',
            }}
          />

          {/* ═══════════════════════════════════════
              MAIN CONTENT
              ═══════════════════════════════════════ */}
          <div className="relative flex flex-col items-center z-10">

            {/* ───── Logo Stage ───── */}
            <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>

              {/* Concentric ripples — continuous loop */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border"
                  style={{
                    width: 130,
                    height: 130,
                    borderColor: 'rgba(0,113,227,0.35)',
                    borderWidth: 1.5,
                  }}
                  animate={{
                    scale: [1, 2.2],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    delay: i * 0.8,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Colored halo behind logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.0, ease: 'easeOut', delay: 0.4 }}
                className="absolute rounded-full splash-halo"
                style={{
                  width: 160,
                  height: 160,
                  background:
                    'radial-gradient(circle, rgba(0,113,227,0.35) 0%, rgba(147,51,234,0.20) 40%, transparent 70%)',
                  filter: 'blur(24px)',
                }}
              />

              {/* Orbiting dots — 3 dots at different speeds */}
              {[
                { color: '#0071E3', size: 10, duration: 5, radius: 92 },
                { color: '#9333EA', size: 8, duration: 7, radius: 92, reverse: true },
                { color: '#06B6D4', size: 6, duration: 4, radius: 92, offset: 60 },
              ].map((orbit, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ width: 184, height: 184 }}
                  animate={{ rotate: orbit.reverse ? -360 : 360 }}
                  transition={{
                    duration: orbit.duration,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: orbit.offset ? orbit.offset / 100 : 0,
                  }}
                >
                  <span
                    className="absolute rounded-full"
                    style={{
                      width: orbit.size,
                      height: orbit.size,
                      background: orbit.color,
                      top: '50%',
                      left: 0,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: `0 0 12px ${orbit.color}, 0 0 4px ${orbit.color}`,
                    }}
                  />
                </motion.div>
              ))}

              {/* Static ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className="absolute rounded-full"
                style={{
                  width: 184,
                  height: 184,
                  border: '1px solid rgba(0,113,227,0.15)',
                }}
              />

              {/* Logo container — rounded square with gradient border */}
              <motion.div
                initial={{ opacity: 0, scale: 0.2, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                  duration: 1.2,
                  ease: [0.34, 1.56, 0.64, 1],
                  delay: 0.5,
                }}
                className="relative"
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 28,
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(0,113,227,0.12)',
                  boxShadow:
                    '0 24px 60px -12px rgba(0,113,227,0.25), 0 8px 20px -4px rgba(147,51,234,0.15), inset 0 0 0 1px rgba(255,255,255,0.8)',
                  padding: 6,
                }}
              >
                <img
                  src="/logo.png"
                  alt="Scuttle.io"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: 22,
                  }}
                />
              </motion.div>
            </div>

            {/* ───── Brand name — letter by letter ───── */}
            <div
              className="mt-10 flex items-baseline"
              style={{ perspective: '400px' }}
            >
              {brandLetters.map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 32, rotateX: -90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 1.2 + i * 0.06,
                  }}
                  style={{
                    display: 'inline-block',
                    fontSize: 38,
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: '#000000',
                    fontFamily:
                      '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif',
                    transformStyle: 'preserve-3d',
                    willChange: 'transform, opacity',
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* ───── Tagline ───── */}
            <motion.p
              initial={{ opacity: 0, y: 12, letterSpacing: '0.5em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '0.32em' }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 1.8 }}
              className="mt-4 text-[11px] font-bold uppercase"
              style={{
                color: '#4B5563',
                fontFamily:
                  '-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif',
              }}
            >
              Live University Updates
            </motion.p>

            {/* ───── Loading stage ───── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 2.2 }}
              className="mt-14 flex flex-col items-center gap-3"
            >
              {/* Progress bar */}
              <div
                className="relative overflow-hidden"
                style={{
                  width: 200,
                  height: 3,
                  borderRadius: 999,
                  background: 'rgba(0,113,227,0.16)',
                }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progress}%`,
                    background:
                      'linear-gradient(90deg, #0071E3 0%, #9333EA 50%, #06B6D4 100%)',
                    transition: 'width 0.15s linear',
                    boxShadow: '0 0 12px rgba(0,113,227,0.5)',
                  }}
                />
                {/* Continuous shimmer sweep */}
                <div className="absolute inset-0 splash-bar-shimmer" />
              </div>

              {/* Percentage + status text */}
              <div className="flex items-center gap-2 text-[10px] font-medium" style={{ color: '#4B5563' }}>
                <span
                  style={{
                    fontFamily:
                      'ui-monospace,SFMono-Regular,"SF Mono",Menlo,monospace',
                    letterSpacing: '0.05em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {String(progress).padStart(3, '0')}%
                </span>
                <span style={{ opacity: 0.4 }}>·</span>
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  Syncing updates
                </motion.span>
              </div>
            </motion.div>
          </div>

          {/* ───── Bottom brand mark ───── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4, duration: 0.7 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
          >
            <p
              className="text-[9px] font-semibold tracking-[0.42em] uppercase"
              style={{
                color: '#1D1D1F',
                fontFamily:
                  '-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif',
              }}
            >
              Darkgrid Automation
            </p>
          </motion.div>

          {/* ───── Keyframes ───── */}
          <style>{`
            @keyframes splash-orb-float-1 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              50%      { transform: translate(40px, -30px) scale(1.08); }
            }
            @keyframes splash-orb-float-2 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              50%      { transform: translate(-50px, 30px) scale(1.10); }
            }
            @keyframes splash-orb-float-3 {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33%      { transform: translate(20px, 20px) scale(1.05); }
              66%      { transform: translate(-20px, -10px) scale(0.96); }
            }
            @keyframes splash-halo-breathe {
              0%, 100% { transform: scale(1); opacity: 1; }
              50%      { transform: scale(1.10); opacity: 0.75; }
            }
            @keyframes splash-particle-float {
              0%   { transform: translateY(0) translateX(0); opacity: 0.15; }
              50%  { opacity: 0.55; }
              100% { transform: translateY(-40px) translateX(20px); opacity: 0.15; }
            }
            @keyframes splash-shimmer-line {
              0%   { background-position: 0% 50%; }
              100% { background-position: 200% 50%; }
            }
            @keyframes splash-bar-shimmer {
              0%   { transform: translateX(-120%); }
              100% { transform: translateX(220%); }
            }
            .splash-orb-1 { animation: splash-orb-float-1 12s ease-in-out infinite; }
            .splash-orb-2 { animation: splash-orb-float-2 14s ease-in-out infinite; }
            .splash-orb-3 { animation: splash-orb-float-3 16s ease-in-out infinite; }
            .splash-halo   { animation: splash-halo-breathe 3s ease-in-out infinite; }
            .splash-particle {
              animation-name: splash-particle-float;
              animation-timing-function: ease-in-out;
              animation-iteration-count: infinite;
            }
            .splash-bar-shimmer {
              background: linear-gradient(
                90deg,
                transparent 0%,
                rgba(255,255,255,0.85) 45%,
                rgba(255,255,255,0.95) 50%,
                rgba(255,255,255,0.85) 55%,
                transparent 100%
              );
              width: 60px;
              animation: splash-bar-shimmer 1.8s ease-in-out infinite;
              pointer-events: none;
              mix-blend-mode: overlay;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
