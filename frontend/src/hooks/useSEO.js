import { useEffect } from 'react'

export function useSEO({ title, description, canonical, image }) {
  useEffect(() => {
    const baseTitle = 'Scuttle.io'
    document.title = title ? `${title} — ${baseTitle}` : `${baseTitle} — Live Nigerian University Updates`

    const setMeta = (selector, attr, value) => {
      if (!value) return
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        const [key, val] = selector.replace(/[[\]"']/g, '').split('=')
        el.setAttribute(key.replace('meta ', ''), val)
        document.head.appendChild(el)
      }
      el.setAttribute(attr, value)
    }

    if (description) {
      setMeta('meta[name="description"]', 'content', description)
      setMeta('meta[property="og:description"]', 'content', description)
      setMeta('meta[name="twitter:description"]', 'content', description)
    }
    if (title) {
      setMeta('meta[property="og:title"]', 'content', `${title} — ${baseTitle}`)
      setMeta('meta[name="twitter:title"]', 'content', `${title} — ${baseTitle}`)
    }
    if (image) {
      setMeta('meta[property="og:image"]', 'content', image)
      setMeta('meta[name="twitter:image"]', 'content', image)
    }
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'canonical'
        document.head.appendChild(link)
      }
      link.href = canonical
    }
  }, [title, description, canonical, image])
}
