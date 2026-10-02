import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Link2, Check, MessageCircle, Send } from 'lucide-react'
import {
  shareApp,
  whatsappShareUrl,
  twitterShareUrl,
  telegramShareUrl,
  APP_URL,
  APP_TAGLINE,
} from '../lib/share'

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const TelegramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
)

const CompactIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export default function ShareAppCard({ variant = 'default' }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const result = await shareApp()
    if (result === 'copied') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  // ── Compact variant — used in header or sidebar ──
  if (variant === 'compact') {
    return (
      <button
        onClick={handleShare}
        className="flex items-center gap-2 text-sm font-medium text-apple-blue hover:opacity-70 transition-opacity"
      >
        <Share2 size={14} />
        Share Scuttle.io
      </button>
    )
  }

  // ── Full card variant — used in Footer / Profile ──
  return (
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
      {/* Decorative pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
            <Share2 size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">Know someone applying?</h3>
            <p className="text-sm text-white/90 leading-relaxed">
              Share Scuttle.io — help a friend never miss an admission update.
            </p>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleShare}
            className="flex-1 min-w-[120px] bg-white text-apple-blue hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:-translate-y-0.5"
          >
            <Share2 size={14} />
            Share
          </button>
          <a
            href={whatsappShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on WhatsApp"
            className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center transition-all hover:-translate-y-0.5"
          >
            <CompactIcon width={18} height={18} />
          </a>
          <a
            href={twitterShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on X"
            className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center transition-all hover:-translate-y-0.5"
          >
            <XIcon width={15} height={15} />
          </a>
          <a
            href={telegramShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="Share on Telegram"
            className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center transition-all hover:-translate-y-0.5"
          >
            <TelegramIcon width={18} height={18} />
          </a>
          <button
            onClick={handleCopyLink}
            title="Copy link"
            className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center transition-all hover:-translate-y-0.5"
          >
            {copied ? <Check size={16} className="text-green-300" /> : <Link2 size={16} />}
          </button>
        </div>

        <AnimatePresence>
          {copied && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-center mt-3 text-white/90"
            >
              ✅ Link copied to clipboard
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
