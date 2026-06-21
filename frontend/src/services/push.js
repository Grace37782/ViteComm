import { api } from './api'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const { publicKey } = await api.get('/notifications/push/vapid-key')
    if (!publicKey) return null

    const existing = await registration.pushManager.getSubscription()
    if (existing) {
      await api.post('/notifications/push/subscribe', {
        endpoint: existing.endpoint,
        p256dh: existing.keys.p256dh,
        auth: existing.keys.auth,
      }).catch(() => {})
      return existing
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })

    await api.post('/notifications/push/subscribe', {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    })

    return subscription
  } catch (err) {
    console.warn('Push subscription failed:', err)
    return null
  }
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await api.post('/notifications/push/unsubscribe', { endpoint: subscription.endpoint }).catch(() => {})
      await subscription.unsubscribe()
    }
  } catch { /* ignore */ }
}
