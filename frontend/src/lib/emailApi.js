const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function post(path, body) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.warn(`[emailApi] ${path} failed:`, err.message)
    return null
  }
}

export function triggerWelcomeEmail(email, name) {
  return post('/api/v1/send-welcome', { email, name })
}

export function triggerSubscriptionEmail(email, name, frequency = 'instant') {
  return post('/api/v1/send-subscription', { email, name, frequency })
}
