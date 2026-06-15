declare global {
  interface Window {
    umami?: { track(event: string, data?: Record<string, unknown>): void }
  }
}

export function initAnalytics(): void {
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined
  if (!websiteId) return
  const s = document.createElement('script')
  s.async = true
  s.defer = true
  s.src = 'https://analytics.game.ionleu.com/script.js'
  s.dataset.websiteId = websiteId
  document.head.appendChild(s)
}

export function trackEvent(event: string, data?: Record<string, unknown>): void {
  window.umami?.track(event, data)
}
