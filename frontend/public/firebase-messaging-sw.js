// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyD9OD2X8QDLdrDRcsiSRa7rvya-apP1awU",
  authDomain: "scuttle-io.firebaseapp.com",
  projectId: "scuttle-io",
  storageBucket: "scuttle-io.firebasestorage.app",
  messagingSenderId: "569597378421",
  appId: "1:569597378421:web:314e32acb6d90b741d5d3c",
})

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Scuttle.io'
  const body = payload.notification?.body || 'New update available'
  const url = payload.data?.url || '/'

  self.registration.showNotification(title, {
    body,
    icon: '/android-chrome-192x192.png',
    badge: '/favicon-32x32.png',
    data: { url },
    vibrate: [200, 100, 200],
    tag: 'scuttle-notification',
  })
})

// Handle notification click — open the URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a Scuttle tab is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
