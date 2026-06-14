import { useState, useEffect, useCallback } from 'react'
import { getVapidPublicKey, subscribePush, unsubscribePush } from '../api/push.api'
import { useAuthStore } from '../store/auth.store'

/**
 * Convertit une clé publique VAPID (base64url) en Uint8Array
 * attendu par pushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

/** Vérifie le support Push notifications dans ce navigateur. */
const checkSupport = (): boolean =>
  typeof Notification !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window

/**
 * D5 - Hook pour gérer l'abonnement aux notifications push PWA.
 *
 * Usage :
 * ```tsx
 * const { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications()
 * ```
 */
export const usePushNotifications = () => {
  const { isAuthenticated } = useAuthStore()

  const [isSupported]  = useState(checkSupport)
  const [permission, setPermission] = useState<NotificationPermission>(
    checkSupport() ? Notification.permission : 'denied',
  )
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)

  // Vérifie si un abonnement actif existe déjà dans le Service Worker
  useEffect(() => {
    if (!isSupported || !isAuthenticated) return

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => {/* SW pas encore actif - silencieux */})
  }, [isSupported, isAuthenticated])

  /**
   * Demande la permission, souscrit au push et enregistre l'abonnement côté backend.
   */
  const subscribe = useCallback(async () => {
    if (!isSupported || !isAuthenticated) return

    setIsLoading(true)
    try {
      const vapidPublicKey = await getVapidPublicKey()
      const reg            = await navigator.serviceWorker.ready

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        // Cast nécessaire : ArrayBufferLike vs ArrayBuffer dans les types TS strict
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      })

      await subscribePush(sub.toJSON() as PushSubscriptionJSON)
      setPermission('granted')
      setIsSubscribed(true)
    } catch (err) {
      // L'utilisateur peut avoir refusé la permission
      setPermission(checkSupport() ? Notification.permission : 'denied')
      console.error('[Push] Échec de l\'abonnement:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, isAuthenticated])

  /**
   * Révoque l'abonnement dans le Service Worker et supprime le backend.
   */
  const unsubscribe = useCallback(async () => {
    if (!isSupported) return

    setIsLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await unsubscribePush(sub.endpoint)
        await sub.unsubscribe()
      }
      setIsSubscribed(false)
    } catch (err) {
      console.error('[Push] Échec de la désinscription:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  return { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe }
}
