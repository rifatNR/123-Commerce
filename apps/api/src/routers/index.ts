import { router } from '../trpc/init'
import { authRouter } from './auth'
import { catalogRouter } from './catalog'
import { ordersRouter } from './orders'
import { productsRouter } from './products'
import { sourcesRouter } from './sources'
import { storefrontRouter } from './storefront'
import { uploadsRouter } from './uploads'
import { visitorsRouter } from './visitors'

export const appRouter = router({
  auth: authRouter,
  storefront: storefrontRouter,
  orders: ordersRouter,
  products: productsRouter,
  sources: sourcesRouter,
  catalog: catalogRouter,
  uploads: uploadsRouter,
  visitors: visitorsRouter,
})

export type AppRouter = typeof appRouter
