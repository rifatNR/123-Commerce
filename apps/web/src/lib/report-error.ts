'use client'

import { publicApi } from './browser-api'
import { getVisitorId } from './visitor'

let sent = 0

/** Sends browser errors to the backend (capped per page load so a loop can't flood it). */
export const reportError = (error: unknown, context?: Record<string, unknown>) => {
  if (sent >= 5) return
  sent += 1
  const err = error instanceof Error ? error : new Error(String(error))
  publicApi.visitors.log
    .mutate({
      level: 'error',
      message: err.message.slice(0, 2000),
      stack: err.stack?.slice(0, 8000),
      path: location.pathname,
      visitorId: getVisitorId(),
      context,
    })
    .catch(() => undefined)
}
