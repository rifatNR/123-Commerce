export type DeviceInfo = {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown'
  os: string | null
  browser: string | null
  /** In-app browsers matter a lot for ad traffic (Facebook/Instagram/TikTok webviews). */
  inAppBrowser: string | null
}

const match = (ua: string, rules: [RegExp, string][]) =>
  rules.find(([re]) => re.test(ua))?.[1] ?? null

/** Small dependency-free user agent parser. Good enough for analytics, not for feature detection. */
export const parseUserAgent = (ua: string | null | undefined): DeviceInfo => {
  if (!ua) return { deviceType: 'unknown', os: null, browser: null, inAppBrowser: null }
  const deviceType: DeviceInfo['deviceType'] = /bot|crawler|spider|facebookexternalhit/i.test(ua)
    ? 'bot'
    : /ipad|tablet/i.test(ua)
      ? 'tablet'
      : /mobi|android|iphone/i.test(ua)
        ? 'mobile'
        : 'desktop'

  return {
    deviceType,
    os: match(ua, [
      [/android/i, 'Android'],
      [/iphone|ipad|ipod/i, 'iOS'],
      [/windows/i, 'Windows'],
      [/mac os/i, 'macOS'],
      [/linux/i, 'Linux'],
    ]),
    browser: match(ua, [
      [/edg\//i, 'Edge'],
      [/samsungbrowser/i, 'Samsung Internet'],
      [/opr\/|opera/i, 'Opera'],
      [/ucbrowser/i, 'UC Browser'],
      [/chrome|crios/i, 'Chrome'],
      [/firefox|fxios/i, 'Firefox'],
      [/safari/i, 'Safari'],
    ]),
    inAppBrowser: match(ua, [
      [/FBAN|FBAV|FB_IAB/i, 'Facebook'],
      [/Messenger/i, 'Messenger'],
      [/Instagram/i, 'Instagram'],
      [/musical_ly|TikTok|BytedanceWebview/i, 'TikTok'],
      [/YouTube/i, 'YouTube'],
      [/WhatsApp/i, 'WhatsApp'],
    ]),
  }
}
