import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// Fade out the static boot splash once React mounts
const bootEl = document.getElementById('scuttle-boot')
if (bootEl) {
  requestAnimationFrame(() => {
    setTimeout(() => {
      bootEl.classList.add('hide')
      setTimeout(() => bootEl.remove(), 600)
    }, 100)
  })

  // BOOT_FALLBACK_V1 — hard-remove after 3s no matter what
  setTimeout(() => {
    const leftover = document.getElementById('scuttle-boot')
    if (leftover) leftover.remove()
  }, 3000)
}


// Workbox network error handler — silently ignore cache write failures
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'CACHE_ERROR') {
      console.warn('Cache write failed (ignored):', event.data)
    }
  })
  // Suppress unhandled promise rejections from Workbox
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'NetworkError' && String(event.reason?.message || '').includes('Cache.put')) {
      event.preventDefault()
    }
  })
}
