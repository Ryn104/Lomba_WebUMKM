import { Link } from 'react-router-dom'
import { Store as StoreIcon, MessageCircle, MapPin, Phone } from 'lucide-react'

function navItemsFor(sections = []) {
  return [
    { id: 'about', label: 'Tentang', href: '#about' },
    { id: 'products', label: 'Produk', href: '#products' },
    { id: 'gallery', label: 'Galeri', href: '#gallery' },
    { id: 'testimonials', label: 'Testimoni', href: '#testimonials' },
    { id: 'contact', label: 'Kontak', href: '#contact' },
  ].filter((item) => sections.some((s) => s.type === item.id))
}

export function StorefrontHeader({ store, sections = [], primary, layout = 'split' }) {
  const nav = navItemsFor(sections)
  const wa = (store.whatsapp || '').replace(/\D/g, '')

  const brand = (
    <div className="flex items-center gap-2 font-bold text-slate-900">
      {store.logo_url ? (
        <img src={store.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
      ) : (
        <span className="rounded-lg p-1.5 text-white" style={{ background: primary }}><StoreIcon size={16} /></span>
      )}
      {store.name}
    </div>
  )
  const navLinks = nav.map((item) => (
    <a key={item.id} href={item.href} className="hover:text-slate-900">{item.label}</a>
  ))

  if (layout === 'minimal') {
    return (
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
          {brand}
          {wa
            ? (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{ background: primary }}
              >
                <MessageCircle size={16} /> Chat Kami
              </a>
            ) : (
              <nav className="flex gap-4 text-sm font-medium text-slate-600">{navLinks}</nav>
            )}
        </div>
      </header>
    )
  }

  if (layout === 'center') {
    return (
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-3">
          {brand}
          {nav.length > 0 && (
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-medium text-slate-600">{navLinks}</nav>
          )}
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {brand}
        {nav.length > 0 && <nav className="flex gap-5 text-sm font-medium text-slate-600 sm:flex">{navLinks}</nav>}
      </div>
    </header>
  )
}

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
