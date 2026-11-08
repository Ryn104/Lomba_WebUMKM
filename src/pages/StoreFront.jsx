import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Store as StoreIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/ui/Field'
import SectionRenderer from '../components/store-front/SectionRenderer'
import { StorefrontFooter, StorefrontHeader } from '../components/store-front/HeaderFooter'
import { resolveTheme } from '../components/builder/themes'

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
        supabase.from('products').select('*, categories(name)').eq('store_id', store.id).eq('is_active', true).order('created_at', { ascending: false }),
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
  const theme = resolveTheme(store)
  const primary = theme.primary

  // Fitur Watermark: Ditampilkan pada paket Gratis; dihilangkan pada paket Bisnis / Pro / Trial
  const sub = store.theme?.subscription || {}
  const hasActiveSubscription = ['active', 'complimentary'].includes(sub.billingMode)
    && (!sub.renewsAt || new Date(sub.renewsAt).getTime() > Date.now())
  const hasWatermark = !hasActiveSubscription || !['bisnis', 'pro'].includes(sub.plan || 'gratis')

  return (
    <div data-light-zone className="min-h-screen bg-white" style={{ fontFamily: `${theme.font}, Inter, sans-serif` }}>
      <StorefrontHeader store={store} sections={sections} primary={primary} layout={theme.headerLayout} />

      {sections.length === 0 ? (
        <p className="py-24 text-center text-slate-400">Website toko ini belum diisi.</p>
      ) : (
        sections.map((s) => (
          <SectionRenderer
            key={s.id}
            section={s}
            store={store}
            products={products}
            discounts={discounts}
            primary={primary}
            layout={theme.layouts[s.type]}
          />
        ))
      )}

      <StorefrontFooter store={store} sections={sections} primary={primary} layout={theme.footerLayout} hasWatermark={hasWatermark} />
    </div>
  )
}
