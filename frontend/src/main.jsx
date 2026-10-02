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
}
