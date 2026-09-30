import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function useAuthGate() {
  const { user } = useAuth()
  const [gateOpen, setGateOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [reason, setReason] = useState('continue')

  const requireAuth = useCallback(
    (action, reasonText = 'continue') => {
      if (user) {
        action()
        return true
      }
      setPendingAction(() => action)
      setReason(reasonText)
      setGateOpen(true)
      return false
    },
    [user]
  )

  const closeGate = useCallback(() => {
    setGateOpen(false)
    setPendingAction(null)
  }, [])

  return { gateOpen, closeGate, requireAuth, reason, isAuthed: !!user }
}
