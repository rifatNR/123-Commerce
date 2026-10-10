'use client'

type Fbq = (...args: unknown[]) => void

/** Fires a Meta Pixel event if the pixel is installed. */
export const trackPixel = (event: string, data?: Record<string, unknown>, eventId?: string) => {
  const fbq = (window as unknown as { fbq?: Fbq }).fbq
  if (fbq) fbq('track', event, data, eventId ? { eventID: eventId } : undefined)
}
