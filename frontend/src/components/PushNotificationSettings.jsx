import { useState } from 'react'
import { Bell, BellOff, Loader2, Check, AlertCircle, Smartphone } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
  isPushSupported,
  isStandalonePWA,
  enablePushNotifications,
  disablePushNotifications,
} from '../lib/pushNotifications'

export default function PushNotificationSettings() {
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const enabled = profile?.pushEnabled === true
  const supported = isPushSupported()

  const handleToggle = async () => {
    setToast(null)
    setLoading(true)
    try {
      if (enabled) {
        await disablePushNotifications(user)
        await refreshProfile()
        setToast({ type: 'success', msg: 'Notifications disabled' })
      } else {
        if (isIOS && !isStandalonePWA()) {
          setToast({
            type: 'error',
            msg: 'Add Scuttle to your home screen first (see the prompt)',
          })
          return
        }
        await enablePushNotifications(user)
        await refreshProfile()
        setToast({ type: 'success', msg: 'Notifications enabled!' })
      }
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Failed' })
    } finally {
      setLoading(false)
      setTimeout(() => setToast(null), 3000)
    }
  }

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-apple border border-gray-100 mb-6">
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          enabled ? 'bg-amber-50' : 'bg-gray-100'
        }`}>
          {enabled ? (
            <Bell size={20} className="text-amber-600" />
          ) : (
            <BellOff size={20} className="text-apple-gray" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Push Notifications</h2>
          <p className="text-sm text-apple-gray mb-4">
            Get instant alerts on your phone when new updates match your interests.
          </p>

          {!supported && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700 mb-3">
              Your browser doesn't support push notifications. Try Chrome on desktop or Android.
            </div>
          )}

          {supported && isIOS && !isStandalonePWA() && !enabled && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-apple-blue mb-3 flex items-start gap-2">
              <Smartphone size={14} className="flex-shrink-0 mt-0.5" />
              <span>On iOS, you must add Scuttle to your home screen first.</span>
            </div>
          )}

          {supported && (
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 ${
                enabled
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-apple-blue text-white hover:bg-blue-600 shadow-md'
              }`}
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : enabled ? (
                <BellOff size={15} />
              ) : (
                <Bell size={15} />
              )}
              {enabled ? 'Disable Notifications' : 'Enable Notifications'}
            </button>
          )}

          {toast && (
            <div className={`mt-3 flex items-center gap-2 text-xs ${
              toast.type === 'error' ? 'text-red-600' : 'text-green-600'
            }`}>
              {toast.type === 'error' ? <AlertCircle size={13} /> : <Check size={13} />}
              {toast.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
