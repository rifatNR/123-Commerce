import type { Collection } from 'mongodb'
import { getDb } from './client'
import type {
  AdminDoc,
  CatalogDoc,
  ClientLogDoc,
  CounterDoc,
  CustomerDoc,
  OrderDoc,
  ProductDoc,
  RefreshTokenDoc,
  SourceDoc,
  SourceProductDoc,
  VisitorDoc,
} from './types'

const col = <T extends object>(name: string) => getDb().collection<T>(name)

export const collections = {
  products: () => col<ProductDoc>('products'),
  sources: () => col<SourceDoc>('sources'),
  categories: () => col<CatalogDoc>('categories'),
  brands: () => col<CatalogDoc>('brands'),
  orders: () => col<OrderDoc>('orders'),
  customers: () => col<CustomerDoc>('customers'),
  visitors: () => col<VisitorDoc>('visitors'),
  admins: () => col<AdminDoc>('admins'),
  refreshTokens: () => col<RefreshTokenDoc>('refresh_tokens'),
  clientLogs: () => col<ClientLogDoc>('client_logs'),
  counters: () => col<CounterDoc>('counters'),
  /** Each product source keeps its raw records in its own collection. */
  sourceProducts: (sourceSlug: string): Collection<SourceProductDoc> =>
    col<SourceProductDoc>(sourceCollectionName(sourceSlug)),
}

export const sourceCollectionName = (sourceSlug: string) => `src_${sourceSlug.replace(/-/g, '_')}`

export const catalogCollection = (kind: 'category' | 'brand') =>
  kind === 'category' ? collections.categories() : collections.brands()
