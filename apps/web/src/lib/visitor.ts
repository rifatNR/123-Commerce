'use client'

const VISITOR_KEY = 'vid'
const ATTRIBUTION_KEY = 'attr'
const TRACKED_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
  'ttclid',
]

const storage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Private mode or storage disabled: tracking just becomes per-page.
    }
  },
}

export const getVisitorId = () => {
  let id = storage.get(VISITOR_KEY)
  if (!id) {
    id = crypto.randomUUID()
    storage.set(VISITOR_KEY, id)
  }
  return id
}

/** Ad parameters from the current URL (utm_*, fbclid, ...). */
export const readAdParams = (search: string) => {
  const params = new URLSearchParams(search)
  return Object.fromEntries(
    TRACKED_PARAMS.flatMap((k) => (params.get(k) ? [[k, params.get(k)!.slice(0, 500)]] : [])),
  )
}

/** Remembers the latest ad click so it can be attached to the order. */
export const rememberAttribution = (params: Record<string, string>) => {
  if (Object.keys(params).length > 0) {
    storage.set(
      ATTRIBUTION_KEY,
      JSON.stringify({ ...params, landing_at: new Date().toISOString() }),
    )
  }
}

export const getAttribution = (): Record<string, string> => {
  try {
    return JSON.parse(storage.get(ATTRIBUTION_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}
