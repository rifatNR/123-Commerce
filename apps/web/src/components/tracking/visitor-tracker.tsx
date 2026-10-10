'use client'

import { useEffect } from 'react'
import { publicApi } from '@/lib/browser-api'
import { reportError } from '@/lib/report-error'
import { getVisitorId, readAdParams, rememberAttribution } from '@/lib/visitor'

const SESSION_KEY = 'tracked'

/**
 * Records each visit once per browser session (device, referrer, ad params like fbclid/utm).
 * Also installs global error reporting.
 */
export default function VisitorTracker() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportError(e.error ?? e.message)
    const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)

    const params = readAdParams(location.search)
    rememberAttribution(params)
    let alreadyTracked = false
    try {
      alreadyTracked = sessionStorage.getItem(SESSION_KEY) === '1'
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      // ignore
    }
    if (!alreadyTracked || Object.keys(params).length > 0) {
      publicApi.visitors.track
        .mutate({
          visitorId: getVisitorId(),
          path: location.pathname + location.search,
          referrer: document.referrer || undefined,
          params,
          screen: { w: screen.width, h: screen.height },
          language: navigator.language,
        })
        .catch(() => undefined)
    }

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return null
}
