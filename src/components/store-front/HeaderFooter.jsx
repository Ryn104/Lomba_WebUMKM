import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Store as StoreIcon, MessageCircle, MapPin, Phone, Menu, X } from 'lucide-react'

/** Section nav yang dipakai storefront, preview builder, dan preview galeri — selalu sama. */
function navItemsFor(sections = []) {
  return [
    { id: 'about', label: 'Tentang', href: '#about' },
    { id: 'products', label: 'Produk', href: '#products' },
    { id: 'gallery', label: 'Galeri', href: '#gallery' },
    { id: 'testimonials', label: 'Testimoni', href: '#testimonials' },
    { id: 'contact', label: 'Kontak', href: '#contact' },
  ].filter((item) => sections.some((s) => s.type === item.id))
}

/** Header storefront dengan tiga layout variant: split (default), centered, minimal. */
export function StorefrontHeader({ store, sections = [], primary, layout = 'split' }) {
  const nav = navItemsFor(sections)
  const wa = (store.whatsapp || '').replace(/\D/g, '')
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const closeMenu = () => setOpen(false)

  const brand = (
    <div className="flex min-w-0 items-center gap-2 font-bold text-slate-900">
      {store.logo_url ? (
        <img src={store.logo_url} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
      ) : (
        <span className="shrink-0 rounded-lg p-1.5 text-white" style={{ background: primary }}><StoreIcon size={16} /></span>
      )}
      <span className="truncate">{store.name}</span>
    </div>
  )
  const navLinks = nav.map((item) => (
    <a key={item.id} href={item.href} onClick={closeMenu} className="hover:text-slate-900">{item.label}</a>
  ))

  // Dropdown mobile sederhana: hamburger + panel di bawah header (hanya < sm).
  const menuButton = nav.length > 0 && (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-label={open ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
      aria-expanded={open}
      aria-controls={menuId}
      className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:hidden"
    >
      {open ? <X size={18} /> : <Menu size={18} />}
    </button>
  )
  const mobilePanel = nav.length > 0 && open && (
    <div id={menuId} className="absolute inset-x-0 top-full z-40 border-b border-slate-100 bg-white shadow-lg sm:hidden">
      <nav className="mx-auto flex max-w-6xl flex-col gap-0.5 px-4 py-2 text-sm font-medium text-slate-700">
        {nav.map((item) => (
          <a key={item.id} href={item.href} onClick={closeMenu} className="rounded-lg px-2 py-2 transition hover:bg-slate-50 hover:text-slate-900">{item.label}</a>
        ))}
      </nav>
    </div>
  )
  const headerProps = {
    className: 'relative sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur',
    onKeyDown: (event) => { if (event.key === 'Escape') closeMenu() },
  }

  if (layout === 'minimal') {
    return (
      <header {...headerProps}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5">
          {brand}
          {wa ? (
            <div className="flex items-center gap-1">
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{ background: primary }}
              >
                <MessageCircle size={16} /> Chat Kami
              </a>
              {menuButton}
            </div>
          ) : (
            <>
              <nav className="hidden gap-4 text-sm font-medium text-slate-600 sm:flex">{navLinks}</nav>
              {menuButton}
            </>
          )}
        </div>
        {mobilePanel}
      </header>
    )
  }

  if (layout === 'center') {
    return (
      <header {...headerProps}>
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-3">
          <div className="relative flex w-full items-center justify-center">
            {brand}
            <div className="absolute right-0 sm:hidden">{menuButton}</div>
          </div>
          {nav.length > 0 && (
            <nav className="hidden flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-medium text-slate-600 sm:flex">{navLinks}</nav>
          )}
        </div>
        {mobilePanel}
      </header>
    )
  }

  // split (default)
  return (
    <header {...headerProps}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        {brand}
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 sm:flex">{navLinks}</nav>
          {menuButton}
        </div>
      </div>
      {mobilePanel}
    </header>
  )
}

/** Footer storefront dengan tiga layout variant: minimal (default), multi, branded. */
export function StorefrontFooter({ store, sections = [], primary, layout = 'minimal', hasWatermark = false }) {
  const year = new Date().getFullYear()
  const wa = (store.whatsapp || '').replace(/\D/g, '')
  const address = sections.find((s) => s.type === 'contact')?.content?.address
  const contact = [
    { icon: MapPin, value: address, hidden: !address },
    { icon: Phone, value: store.whatsapp, hidden: !store.whatsapp },
  ].filter((x) => !x.hidden)

  if (layout === 'multi') {
    return (
      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold text-white">
              {store.logo_url && <img src={store.logo_url} alt="" className="h-8 w-8 rounded object-cover" />}
              {store.name}
            </div>
            {store.description && <p className="mt-3 text-sm leading-relaxed text-slate-400">{store.description}</p>}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Jelajahi</p>
            <ul className="mt-3 space-y-2 text-sm">
              {navItemsFor(sections).map((item) => (
                <li key={item.id}><a href={item.href} className="transition hover:text-white">{item.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Hubungi</p>
            <ul className="mt-3 space-y-2 text-sm">
              {contact.map(({ icon: Icon, value }, i) => (
                <li key={i} className="flex items-start gap-2"><Icon size={15} className="mt-0.5 shrink-0 text-slate-500" /> {value}</li>
              ))}
              {wa && (
                <li>
                  <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-white transition hover:opacity-90">
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
          © {year} {store.name}
          {hasWatermark && (
            <>
              {' · '}
              <Link to="/" className="transition underline underline-offset-2 hover:text-white">Dibuat dengan UMKM Builder</Link>
            </>
          )}
        </div>
      </footer>
    )
  }

  if (layout === 'branded') {
    return (
      <footer className="py-12 text-center text-white" style={{ background: `linear-gradient(160deg, ${primary}, ${primary}dd 60%, #0f172a 140%)` }}>
        <div className="mx-auto max-w-3xl px-6">
          {store.logo_url && <img src={store.logo_url} alt="" className="mx-auto h-12 w-12 rounded-xl object-cover shadow-lg ring-2 ring-white/20" />}
          <p className="mt-4 text-2xl font-extrabold sm:text-3xl">{store.name}</p>
          {store.description && <p className="mt-2 text-sm opacity-80">{store.description}</p>}
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold shadow transition hover:opacity-90"
              style={{ color: primary }}
            >
              <MessageCircle size={16} /> Pesan Sekarang
            </a>
          )}
          <p className="mt-8 text-xs opacity-70">
            © {year} {store.name}
            {hasWatermark && (
              <>
                {' · '}
                <Link to="/" className="font-semibold underline underline-offset-2 hover:opacity-100">Dibuat dengan UMKM Builder</Link>
              </>
            )}
          </p>
        </div>
      </footer>
    )
  }

  // minimal (default)
  return (
    <footer className="bg-slate-900 py-6 text-center text-xs text-slate-400">
      © {year} {store.name}
      {hasWatermark && (
        <>
          {' · '}
          <Link to="/" className="transition underline underline-offset-2 hover:text-white">Dibuat dengan UMKM Builder</Link>
        </>
      )}
    </footer>
  )
}
