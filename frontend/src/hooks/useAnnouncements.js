import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'

const APP_ID = 'scuttle-io-default'

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [status, setStatus] = useState('connecting') // connecting | live | error

  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setStatus('error')
      return
    }

    const colRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'announcements')
    const q = query(colRef, orderBy('date_scraped', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setAnnouncements(items)
        setStatus('live')
      },
      (err) => {
        console.error('Firestore error:', err)
        setStatus('error')
      }
    )

    return () => unsubscribe()
  }, [])

  return { announcements, status }
}
