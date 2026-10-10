import Logo from '@/components/ui/logo'
import CartLink from './cart-link'
import SearchForm from './search-form'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3">
        <Logo />
        <div className="hidden flex-1 md:block">
          <SearchForm />
        </div>
        <div className="ml-auto md:ml-0">
          <CartLink />
        </div>
      </div>
      <div className="container-page pb-3 md:hidden">
        <SearchForm />
      </div>
    </header>
  )
}
