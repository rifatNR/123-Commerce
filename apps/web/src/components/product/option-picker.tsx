'use client'

import type { PublicProduct } from '@123/shared'
import { t } from '@/i18n/bn'
import { cn } from '@/lib/cn'
import { valueState } from '@/lib/variants'

type Props = {
  product: PublicProduct
  option: { name: string; values: string[] }
  chosen: Record<string, string>
  showError: boolean
  onChoose: (value: string) => void
}

/**
 * One option (e.g. সাইজ) as a row of large buttons. Sold-out values are disabled; values that
 * only clash with another choice are dimmed but still pickable (picking clears the clash).
 */
export default function OptionPicker({ product, option, chosen, showError, onChoose }: Props) {
  return (
    <fieldset>
      <legend className={cn('mb-2 font-semibold', showError && 'text-brand-700')}>
        {t.product.selectOption(option.name)}
        {chosen[option.name] && (
          <span className="font-normal text-stone-600">: {chosen[option.name]}</span>
        )}
      </legend>
      <div className="flex flex-wrap gap-2">
        {option.values.map((value) => {
          const selected = chosen[option.name] === value
          const state = valueState(product, chosen, option.name, value)
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              disabled={state === 'soldOut'}
              title={state === 'soldOut' ? t.product.soldOutValue : undefined}
              onClick={() => onChoose(value)}
              className={cn(
                'min-h-11 min-w-12 rounded-xl px-4 font-medium ring-1',
                selected
                  ? 'bg-brand-600 text-white ring-brand-600'
                  : state === 'soldOut'
                    ? 'cursor-not-allowed bg-stone-100 text-stone-400 line-through ring-stone-200'
                    : state === 'conflict'
                      ? 'bg-white text-stone-500 ring-stone-200 hover:ring-brand-400'
                      : 'bg-white ring-stone-300 hover:ring-brand-400',
              )}
            >
              {value}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
