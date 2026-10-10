import { SearchIcon } from '@/components/ui/icons'
import { t } from '@/i18n/bn'

/** Plain GET form: works without JavaScript and on very slow connections. */
export default function SearchForm() {
  return (
    <form action="/products" method="get" role="search" className="relative">
      <input
        type="search"
        name="q"
        placeholder={t.nav.search}
        aria-label={t.nav.search}
        className="h-11 w-full rounded-xl border border-stone-200 bg-stone-100 pr-12 pl-4 outline-none focus:border-brand-500 focus:bg-white"
      />
      <button
        type="submit"
        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-stone-500"
        aria-label={t.nav.search}
      >
        <SearchIcon className="size-5" />
      </button>
    </form>
  )
}
