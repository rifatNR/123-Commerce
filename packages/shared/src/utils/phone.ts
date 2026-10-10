/** Normalizes Bangladeshi mobile numbers to the 01XXXXXXXXX format, or returns null if invalid. */
export const normalizeBdPhone = (input: string): string | null => {
  const digits = toLatinDigits(input).replace(/[^\d]/g, '')
  const local = digits.startsWith('880') ? `0${digits.slice(3)}` : digits
  return /^01[3-9]\d{8}$/.test(local) ? local : null
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯'

/** Customers often type numbers with Bangla digits. */
export const toLatinDigits = (input: string): string =>
  input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
