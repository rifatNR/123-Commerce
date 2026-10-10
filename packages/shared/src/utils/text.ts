import type { LocalizedText } from '../schemas/common'

/** Bangla first, English fallback. */
export const pickText = (text: LocalizedText | undefined | null): string =>
  text?.bn?.trim() || text?.en?.trim() || ''
