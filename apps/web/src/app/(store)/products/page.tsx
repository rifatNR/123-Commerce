import type { Metadata } from 'next'
import CategoryNav from '@/components/layout/category-nav'
import Pagination from '@/components/product/pagination'
import ProductGrid from '@/components/product/product-grid'
import SortSelect from '@/components/product/sort-select'
import { t } from '@/i18n/bn'
import { formatNumber, text } from '@/lib/format'
import { pageMetadata } from '@/lib/seo'
import { getCatalog, getProductList } from '@/lib/storefront'

export const dynamic = 'force-dynamic'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ query }, catalog] = await Promise.all([getProductList(await searchParams), getCatalog()])
  const category = catalog.categories.find((c) => c.slug === query.category)
  const title = query.q ? t.list.searchFor(query.q) : category ? text(category.name) : t.list.title
  const path = category ? `/products?category=${category.slug}` : '/products'
  // Search result pages shouldn't be indexed.
  return pageMetadata({
    title,
    description: `${title} — সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।`,
    path,
    noIndex: Boolean(query.q),
  })
}

export default async function ProductsPage({ searchParams }: Props) {
  const [{ query, result }, catalog] = await Promise.all([
    getProductList(await searchParams),
    getCatalog(),
  ])
  const category = catalog.categories.find((c) => c.slug === query.category)
  const brand = catalog.brands.find((b) => b.slug === query.brand)
  const heading = query.q
    ? t.list.searchFor(query.q)
    : category
      ? text(category.name)
      : t.list.title
  const totalPages = Math.ceil(result.total / result.pageSize)
  const keep = { q: query.q, brand: query.brand }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{heading}</h1>
          <p className="text-stone-600">
            {brand && `${t.product.brand}: ${text(brand.name)} · `}
            {t.list.results(formatNumber(result.total))}
          </p>
        </div>
        <SortSelect value={query.sort} />
      </div>

      <CategoryNav
        categories={catalog.categories}
        active={query.category}
        extraParams={Object.fromEntries(
          Object.entries(keep).filter((e): e is [string, string] => Boolean(e[1])),
        )}
      />

      {result.items.length > 0 ? (
        <ProductGrid products={result.items} priorityCount={2} />
      ) : (
        <p className="rounded-2xl bg-white p-10 text-center text-lg text-stone-500 ring-1 ring-stone-200">
          {t.list.empty}
        </p>
      )}

      <Pagination
        page={query.page}
        totalPages={totalPages}
        params={{
          ...keep,
          category: query.category,
          sort: query.sort === 'newest' ? undefined : query.sort,
        }}
      />
    </div>
  )
}
