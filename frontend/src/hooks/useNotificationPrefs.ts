import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '../store/auth.store'

export const NOTIFICATION_TYPES = [
  'BOOKING_REQUEST',
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',
  'BOOKING_COMPLETED',
  'PAYMENT_RECEIVED',
  'NEW_REVIEW',
  'NEW_MESSAGE',
  'KYC_APPROVED',
  'KYC_REJECTED',
  'BOAT_APPROVED',
  'BOAT_REJECTED',
  'BOAT_CREATED',
  'BOAT_STATUS_CHANGED',
  'BOAT_DELETED',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

type Prefs = Partial<Record<string, boolean>>

// Default: all types enabled. A type is disabled only when explicitly set to false.
function readPrefs(key: string): Prefs {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function useNotificationPrefs() {
  const { user } = useAuthStore()
  const storageKey = user ? `sailingloc_notif_prefs_${user.id}` : null

  const [prefs, setPrefs] = useState<Prefs>(() =>
    storageKey ? readPrefs(storageKey) : {},
  )

  useEffect(() => {
    setPrefs(storageKey ? readPrefs(storageKey) : {})
  }, [storageKey])

  const isEnabled = useCallback((type: string) => prefs[type] !== false, [prefs])

  const toggle = useCallback(
    (type: string) => {
      if (!storageKey) return
      setPrefs(prev => {
        const next = { ...prev }
        if (next[type] === false) {
          delete next[type]
        } else {
          next[type] = false
        }
        try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
        return next
      })
    },
    [storageKey],
  )

  const disabledCount = NOTIFICATION_TYPES.filter(t => prefs[t] === false).length

  return { isEnabled, toggle, disabledCount }
}
