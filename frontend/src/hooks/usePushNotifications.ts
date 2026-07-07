import { useState, useEffect, useCallback } from 'react'
import { getVapidPublicKey, subscribePush, unsubscribePush } from '../api/push.api'
import { useAuthStore } from '../store/auth.store'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

const checkSupport = (): boolean =>
  typeof Notification !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window

// Résout avec la registration SW ou rejette après `ms` ms si le SW n'est pas prêt
function swReady(ms = 5000): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Service Worker non disponible')), ms),
    ),
  ])
}

export const usePushNotifications = () => {
  const { isAuthenticated } = useAuthStore()

  const browserSupported = checkSupport()
  const [isBackendReady, setIsBackendReady] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>(
    browserSupported ? Notification.permission : 'denied',
  )
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)

  // Vérifie si le backend a des clés VAPID configurées
  useEffect(() => {
    if (!browserSupported || !isAuthenticated) return
    getVapidPublicKey()
      .then(() => setIsBackendReady(true))
      .catch(() => setIsBackendReady(false))
  }, [browserSupported, isAuthenticated])

  const isSupported = browserSupported && isBackendReady

  // Vérifie si un abonnement actif existe déjà dans le Service Worker
  useEffect(() => {
    if (!isSupported || !isAuthenticated) return
    swReady(3000)
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setIsSubscribed(!!sub))
      .catch(() => {/* SW pas encore actif en dev - silencieux */})
  }, [isSupported, isAuthenticated])

  const subscribe = useCallback(async () => {
    if (!isSupported || !isAuthenticated) return

    setIsLoading(true)
    try {
      const vapidPublicKey = await getVapidPublicKey()
      const reg            = await swReady()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      })

      await subscribePush(sub.toJSON() as PushSubscriptionJSON)
      setPermission('granted')
      setIsSubscribed(true)
    } catch (err) {
      setPermission(checkSupport() ? Notification.permission : 'denied')
      console.error('[Push] Échec de l\'abonnement:', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, isAuthenticated])

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return

    setIsLoading(true)
    try {
      const reg = await swReady()
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
