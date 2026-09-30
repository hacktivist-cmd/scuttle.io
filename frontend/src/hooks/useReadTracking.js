import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'scuttle_read_ids'

function loadReadIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveReadIds(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {}
}

export function useReadTracking() {
  const [readIds, setReadIds] = useState(() => loadReadIds())

  // Sync between tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY) setReadIds(loadReadIds())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const markRead = useCallback((id) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      saveReadIds(next)
      return next
    })
  }, [])

  const isRead = useCallback((id) => readIds.has(id), [readIds])

  const clearAll = useCallback(() => {
    const empty = new Set()
    saveReadIds(empty)
    setReadIds(empty)
  }, [])

  return { readIds, markRead, isRead, clearAll, count: readIds.size }
}
