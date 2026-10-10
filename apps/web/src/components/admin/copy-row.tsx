import CopyButton from '@/components/ui/copy-button'

type Props = { label: string; value: string | number | null | undefined }

/** One labelled, copyable field in the order view. */
export default function CopyRow({ label, value }: Props) {
  if (value === null || value === undefined || value === '') return null
  const text = String(value)
  return (
    <div className="flex items-start gap-2 py-1.5">
      <dt className="w-28 shrink-0 text-sm text-stone-500">{label}</dt>
      <dd className="min-w-0 flex-1 break-words whitespace-pre-line">{text}</dd>
      <CopyButton value={text} />
    </div>
  )
}
