'use client'

import { customerInfoSchema, type DeliveryZone, type StoreConfig } from '@123/shared'
import { TRPCClientError } from '@trpc/client'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { z } from 'zod'
import { buttonClass } from '@/components/ui/button-styles'
import { t } from '@/i18n/bn'
import { api } from '@/lib/browser-api'
import { cn } from '@/lib/cn'
import { formatPrice } from '@/lib/format'
import { trackPixel } from '@/lib/meta-pixel'
import { getAttribution, getVisitorId } from '@/lib/visitor'
import { useCartStore, type CartItem } from '@/stores/cart-store'
import { useOrderStore } from '@/stores/order-store'
import FormField from './form-field'

type Props = {
  items: CartItem[]
  zone: DeliveryZone
  onZoneChange: (zone: DeliveryZone) => void
  fees: StoreConfig['deliveryFees']
  total: number
}

type Errors = Partial<Record<'name' | 'phone' | 'address' | 'form', string>>

const inputClass =
  'h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-lg outline-none focus:border-brand-500'

export default function CheckoutForm({ items, zone, onZoneChange, fees, total }: Props) {
  const router = useRouter()
  const clearCart = useCartStore((s) => s.clear)
  const setLastOrder = useOrderStore((s) => s.setLastOrder)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const parsed = customerInfoSchema.safeParse({
      name: form.get('name'),
      phone: form.get('phone'),
      address: form.get('address'),
      deliveryZone: zone,
      note: (form.get('note') as string) || undefined,
    })
    if (!parsed.success) {
      const fieldErrors = z.flattenError(parsed.error).fieldErrors
      setErrors({
        name: fieldErrors.name?.[0],
        phone: fieldErrors.phone?.[0],
        address: fieldErrors.address?.[0],
      })
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      const order = await api.orders.create.mutate({
        customer: parsed.data,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          options: i.options,
        })),
        visitorId: getVisitorId(),
        attribution: getAttribution(),
      })
      setLastOrder({ ...order, customerName: parsed.data.name, phone: parsed.data.phone })
      trackPixel(
        'Purchase',
        {
          value: order.total,
          currency: 'BDT',
          content_ids: items.map((i) => i.productId),
          content_type: 'product',
        },
        order.orderNumber,
      )
      clearCart()
      router.push('/order/success')
    } catch (err) {
      setErrors({ form: err instanceof TRPCClientError ? err.message : t.checkout.failed })
      setSubmitting(false)
    }
  }

  const zoneOption = (value: DeliveryZone, label: string) => (
    <label
      className={cn(
        'flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-xl px-4 ring-1',
        zone === value ? 'bg-brand-50 ring-2 ring-brand-600' : 'bg-white ring-stone-300',
      )}
    >
      <span className="flex items-center gap-2">
        <input
          type="radio"
          name="zone"
          checked={zone === value}
          onChange={() => onZoneChange(value)}
          className="size-5 accent-brand-600"
        />
        {label}
      </span>
      <span className="font-semibold">{formatPrice(fees[value])}</span>
    </label>
  )

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:p-6"
    >
      <h2 className="text-xl font-bold">{t.checkout.title}</h2>
      <FormField label={t.checkout.name} error={errors.name}>
        <input name="name" autoComplete="name" className={inputClass} />
      </FormField>
      <FormField label={t.checkout.phone} error={errors.phone}>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t.checkout.phonePlaceholder}
          className={inputClass}
        />
      </FormField>
      <FormField label={t.checkout.address} error={errors.address}>
        <textarea
          name="address"
          rows={3}
          autoComplete="street-address"
          placeholder={t.checkout.addressPlaceholder}
          className={cn(inputClass, 'h-auto py-3')}
        />
      </FormField>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">{t.checkout.zone}</legend>
        {zoneOption('inside_dhaka', t.checkout.insideDhaka)}
        {zoneOption('outside_dhaka', t.checkout.outsideDhaka)}
      </fieldset>
      <FormField label={t.checkout.note}>
        <input name="note" className={inputClass} />
      </FormField>

      <p className="rounded-xl bg-amber-50 p-3 text-amber-900">{t.checkout.codNote}</p>
      {errors.form && (
        <p className="rounded-xl bg-brand-50 p-3 font-medium text-brand-800" role="alert">
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={buttonClass('primary', 'lg', 'w-full')}
      >
        {submitting ? t.checkout.submitting : `${t.checkout.submit} — ${formatPrice(total)}`}
      </button>
    </form>
  )
}
