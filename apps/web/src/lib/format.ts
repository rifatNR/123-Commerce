import type { LocalizedText } from '@123/shared'
import { pickText } from '@123/shared'

const bnNumber = new Intl.NumberFormat('bn-BD', { maximumFractionDigits: 0 })

/** ৳ ১,২৫০ */
export const formatPrice = (amount: number) => `৳ ${bnNumber.format(amount)}`

export const formatNumber = (n: number) => bnNumber.format(n)

export const discountPercent = (price: number, compareAt: number | null) =>
  compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dhaka',
  })

export const text = (t: LocalizedText | null | undefined) => pickText(t)
