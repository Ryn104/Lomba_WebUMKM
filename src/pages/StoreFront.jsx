import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Store as StoreIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/Field'
import SectionRenderer from '../components/store-front/SectionRenderer'

/** Halaman publik toko: /:slug */
export default function StoreFront() {
  const { slug } = useParams()
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data: store } = await supabase.from('stores').select('*').eq('slug', slug).maybeSingle()
      if (!alive) return
      if (!store) return setState({ loading: false, notFound: true })

      const [sec, prod, disc] = await Promise.all([
        supabase.from('store_sections').select('*').eq('store_id', store.id).eq('is_visible', true).order('position'),
        supabase.from('products').select('*').eq('store_id', store.id).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('discounts').select('*').eq('store_id', store.id).eq('is_active', true),
      ])
      if (!alive) return
      setState({
        loading: false,
        store,
        sections: sec.data || [],
        products: prod.data || [],
        discounts: disc.data || [],
      })
      document.title = store.name
    })()
    return () => {
      alive = false
    }
  }, [slug])

  if (state.loading) return <Spinner full />

  if (state.notFound)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <StoreIcon size={48} className="text-slate-300" />
        <h1 className="text-2xl font-bold text-slate-900">Toko tidak ditemukan</h1>
        <p className="text-slate-500">
          Toko “{slug}” belum ada atau belum dipublikasikan.
        </p>
        <Link to="/" className="btn-primary mt-2">Ke beranda</Link>
      </div>
    )

  const { store, sections, products, discounts } = state
  const primary = store.theme?.primary || '#047857'

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: store.theme?.font ? `${store.theme.font}, Inter, sans-serif` : undefined }}>
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            {store.logo_url ? (
              <img src={store.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
            ) : (
              <span className="rounded-lg p-1.5 text-white" style={{ background: primary }}><StoreIcon size={16} /></span>
            )}
            {store.name}
          </div>
          <nav className="hidden gap-5 text-sm font-medium text-slate-600 sm:flex">
            {sections.some((s) => s.type === 'about') && <a href="#about" className="hover:text-slate-900">Tentang</a>}
            {sections.some((s) => s.type === 'products') && <a href="#products" className="hover:text-slate-900">Produk</a>}
            {sections.some((s) => s.type === 'gallery') && <a href="#gallery" className="hover:text-slate-900">Galeri</a>}
            {sections.some((s) => s.type === 'contact') && <a href="#contact" className="hover:text-slate-900">Kontak</a>}
          </nav>
        </div>
      </header>

      {sections.length === 0 ? (
        <p className="py-24 text-center text-slate-400">Website toko ini belum diisi.</p>
      ) : (
        sections.map((s) => (
          <SectionRenderer key={s.id} section={s} store={store} products={products} discounts={discounts} primary={primary} />
        ))
      )}

      <footer className="bg-slate-900 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} {store.name} · Dibuat dengan UMKM Builder
      </footer>
    </div>
  )
}
