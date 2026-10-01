/**
 * Push notification helpers — FCM token management + Firestore persistence.
 */
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { app, db } from './firebase'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

let messaging = null

function getMessagingInstance() {
  if (messaging) return messaging
  try {
    messaging = getMessaging(app)
    return messaging
  } catch (err) {
    console.warn('FCM not available:', err.message)
    return null
  }
}

/** Check if the browser supports push notifications */
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

/** Check if we're running as an installed PWA */
export function isStandalonePWA() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

/** Get current notification permission state */
export function getPermissionState() {
  if (typeof window === 'undefined') return 'default'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

/**
 * Request permission + get FCM token + save to Firestore
 * MUST be called from a user gesture (button click).
 */
export async function enablePushNotifications(user) {
  if (!user) throw new Error('Must be signed in to enable notifications')

  if (!isPushSupported()) {
    throw new Error("This browser doesn't support notifications")
  }

  // 1. Request permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Permission denied')
  }

  // 2. Get FCM token
  const msg = getMessagingInstance()
  if (!msg) throw new Error('FCM not initialized')

  // Register SW first (required before getToken on some browsers)
  try {
    await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  } catch (e) {
    console.warn('SW registration warning:', e.message)
  }

  const token = await getToken(msg, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
  })

  if (!token) throw new Error('Failed to generate push token')

  // 3. Save token + platform to Firestore
  const platform = /iPad|iPhone|iPod/.test(navigator.userAgent)
    ? 'ios'
    : /Android/.test(navigator.userAgent)
    ? 'android'
    : 'desktop'

  await setDoc(
    doc(db, 'users', user.uid),
    {
      fcmToken: token,
      fcmPlatform: platform,
      pushEnabled: true,
      pushEnabledAt: serverTimestamp(),
    },
    { merge: true }
  )

  return { token, platform }
}

/** Disable push notifications */
export async function disablePushNotifications(user) {
  if (!user) return
  await setDoc(
    doc(db, 'users', user.uid),
    {
      pushEnabled: false,
      fcmToken: null,
    },
    { merge: true }
  )
}

/** Listen for foreground messages (app is open) */
export function onForegroundMessage(callback) {
  const msg = getMessagingInstance()
  if (!msg) return () => {}
  return onMessage(msg, (payload) => {
    callback({
      title: payload.notification?.title || 'Scuttle.io',
      body: payload.notification?.body || '',
      url: payload.data?.url || '/',
    })
  })
}
