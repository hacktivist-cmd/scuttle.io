import { useState } from 'react'
import { Share2, Link2, MessageCircle, Check } from 'lucide-react'

const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export default function ShareButtons({ item }) {
  const [copied, setCopied] = useState(false)

  const siteUrl = 'https://scuttle-io.netlify.app'

  const shareTitle = item?.title || 'Scuttle.io'
  const shareUni = item?.university_name || ''

  const shareUrl = item?.id ? `${siteUrl}/notice/${item.id}` : siteUrl

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error(e)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `${shareUni} — ${shareTitle}`,
          url: shareUrl,
        })
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e)
      }
    } else {
      handleCopy()
    }
  }

  const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`

  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`${shareUni}: ${shareTitle}\n\n${shareUrl}`)}`

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleNativeShare}
        title="Share"
        className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50 text-apple-gray hover:text-apple-blue transition-colors"
      >
        <Share2 size={15} />
      </button>
      <a
        href={whatsappShare}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on WhatsApp"
        className="p-2 rounded-lg bg-gray-50 hover:bg-green-50 text-apple-gray hover:text-green-600 transition-colors"
      >
        <MessageCircle size={15} />
      </a>
      <a
        href={twitterShare}
        target="_blank"
        rel="noopener noreferrer"
        title="Share on X"
        className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-apple-gray hover:text-apple-dark transition-colors"
      >
        <XIcon width={15} height={15} />
      </a>
      <button
        onClick={handleCopy}
        title="Copy link"
        className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50 text-apple-gray hover:text-apple-blue transition-colors"
      >
        {copied ? <Check size={15} className="text-green-600" /> : <Link2 size={15} />}
      </button>
    </div>
  )
}
