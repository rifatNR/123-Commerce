import { findVariant, type PublicProduct, type PublicVariant } from '@123/shared'

export type ValueState = 'available' | 'conflict' | 'soldOut'

const matches = (variant: PublicVariant, chosen: Record<string, string>) =>
  Object.entries(chosen).every(([name, value]) => variant.options[name] === value)

const others = (chosen: Record<string, string>, name: string) =>
  Object.fromEntries(Object.entries(chosen).filter(([k]) => k !== name))

/** The variant for the current choice, once every option is picked. */
export const selectedVariant = (product: PublicProduct, chosen: Record<string, string>) =>
  product.variants.length > 0 && product.options.every((o) => chosen[o.name])
    ? findVariant(product.variants, chosen)
    : undefined

/**
 * available: buyable with the other current choices.
 * conflict: buyable, but only after changing another choice (picking it clears that choice).
 * soldOut: no in-stock variant has this value.
 */
export const valueState = (
  product: PublicProduct,
  chosen: Record<string, string>,
  name: string,
  value: string,
): ValueState => {
  if (product.variants.length === 0) return 'available'
  const withValue = product.variants.filter((v) => v.inStock && v.options[name] === value)
  if (withValue.length === 0) return 'soldOut'
  return withValue.some((v) => matches(v, others(chosen, name))) ? 'available' : 'conflict'
}

/** Picks a value, dropping other choices that no in-stock variant combines with it. */
export const choose = (
  product: PublicProduct,
  chosen: Record<string, string>,
  name: string,
  value: string,
) => {
  const next: Record<string, string> = { [name]: value }
  if (product.variants.length === 0) return { ...chosen, ...next }
  for (const option of product.options) {
    const current = chosen[option.name]
    if (option.name === name || !current) continue
    const candidate = { ...next, [option.name]: current }
    if (product.variants.some((v) => v.inStock && matches(v, candidate)))
      next[option.name] = current
  }
  return next
}
