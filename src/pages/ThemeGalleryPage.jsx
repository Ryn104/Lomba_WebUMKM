import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Crown, Eye, Monitor, Palette, Smartphone, Sparkles, Store as StoreIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useMyStore } from '../hooks/useMyStore'
import { Spinner } from '../components/ui/Field'
import CreateStore from '../components/builder/CreateStore'
import SectionRenderer from '../components/store-front/SectionRenderer'
import { BUILDER_THEMES, findActiveTheme } from '../components/builder/themes'

export default function ThemeGalleryPage() {
  const { store, setStore, loading, reload } = useMyStore()
  if (loading) return <Spinner full />
  if (!store) return <CreateStore onCreated={reload} />
  return <Gallery store={store} setStore={setStore} />
}

function Gallery({ store, setStore }) {
  const [previewTheme, setPreviewTheme] = useState(null)
  const [device, setDevice] = useState('desktop')
  const [applying, setApplying] = useState(false)
  const [data, setData] = useState({ sections: [], products: [], discounts: [], loading: true })

  // Preview memakai data toko milik pengguna sendiri, bukan data demo.
  useEffect(() => {
    let alive = true
    ;(async () => {
      const [sec, prod, disc] = await Promise.all([
        supabase.from('store_sections').select('*').eq('store_id', store.id).eq('is_visible', true).order('position'),
        supabase.from('products').select('*').eq('store_id', store.id).eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('discounts').select('*').eq('store_id', store.id).eq('is_active', true),
      ])
      if (!alive) return
      setData({ sections: sec.data || [], products: prod.data || [], discounts: disc.data || [], loading: false })
    })()
    return () => { alive = false }
  }, [store.id])

  const activeTheme = useMemo(() => findActiveTheme(store), [store])

  const applyTheme = async (theme) => {
    if (applying) return
    if (activeTheme && activeTheme.id !== theme.id) {
      const ok = window.confirm(`Ganti tema menjadi "${theme.name}"? Tema "${activeTheme.name}" akan digantikan. Tetap lanjut?`)
      if (!ok) return
    }
    setApplying(true)
    try {
      const nextTheme = { ...(store.theme || {}), primary: theme.primary, font: theme.font, mode: theme.id }
      const { data: updated, error } = await supabase.from('stores').update({ theme: nextTheme }).eq('id', store.id).select().single()
      if (error) throw error
      setStore(updated)
      setPreviewTheme(null)
      toast.success(`Tema "${theme.name}" diterapkan! Sampai jumpa di tampilan baru.`)
    } catch (err) {
      toast.error('Gagal menerapkan tema: ' + err.message)
    } finally {
      setApplying(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Link to="/builder" className="btn-ghost -ml-2 px-2 text-sm">
            <ArrowLeft size={18} /> Kembali ke Web Builder
          </Link>

          {/* Header galeri */}
          <header className="mt-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800">
              <Palette size={13} /> Galeri Tema
            </span>
            <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">Temukan Tampilan Website Impianmu</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              Pilih desain website yang paling pas dengan karakter bisnismu. Pratinjau lebih dulu,
              terapkan kapan saja — tema bisa diganti kapan pun tanpa mengubah konten tokomu.
            </p>
          </header>

          {/* Grid kartu tema */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {BUILDER_THEMES.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                storeName={store.name}
                active={activeTheme?.id === theme.id}
                busy={applying}
                onPreview={() => { setPreviewTheme(theme); setDevice('desktop') }}
                onApply={() => applyTheme(theme)}
              />
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Semua tema bawaan dapat digunakan secara gratis sesuai hak akses paketmu. Ingin melihat lebih detail?
            Bandingkan fitur lewat <b>Preview</b> — tidak ada yang tersimpan sebelum kamu menekan "Gunakan Tema".
          </p>
        </div>
      </div>

      {/* Fullscreen Preview */}
      {previewTheme && (
        <ThemePreview
          theme={previewTheme}
          store={store}
          data={data}
          device={device}
          onDevice={setDevice}
          onClose={() => setPreviewTheme(null)}
          onApply={() => applyTheme(previewTheme)}
          applying={applying}
        />
      )}
    </>
  )
}

function ThemeCard({ theme, storeName, active, busy, onPreview, onApply }) {
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
        active ? 'border-brand-600 ring-2 ring-brand-100' : 'border-slate-200'
      }`}
    >
      <div className="relative">
        <ThemeThumb theme={theme} storeName={storeName} />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow">
          {theme.badge}
        </span>
        {active && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-bold text-white shadow">
            <Check size={11} /> Sedang Digunakan
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white shadow-sm ring-1 ring-slate-200" style={{ background: theme.primary }} />
          <h3 className="text-sm font-bold text-slate-900">Tema {theme.name}</h3>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{theme.desc}</p>
        <p className="mt-auto pt-3 text-[11px] text-slate-500">
          <span className="font-bold text-slate-700">Cocok untuk:</span> {theme.suitedFor}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={onPreview} className="btn-secondary justify-center px-2 py-2 text-xs font-semibold">
            <Eye size={14} /> Preview
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={active || busy}
            className="btn-primary justify-center px-2 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-70"
          >
            {active ? 'Sedang Digunakan' : 'Gunakan Tema'}
          </button>
        </div>
      </div>
    </article>
  )
}

/** Thumbnail representatif tema: mock mini-website dengan warna & huruf khas tema. */
function ThemeThumb({ theme, storeName }) {
  return (
    <div className="aspect-[4/3] w-full select-none overflow-hidden bg-white">
      {/* chrome browser */}
      <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-red-300" />
        <span className="h-2 w-2 rounded-full bg-amber-300" />
        <span className="h-2 w-2 rounded-full bg-emerald-300" />
        <span className="ml-2 h-2.5 flex-1 rounded-full bg-slate-200/70" />
      </div>
      {/* mini header toko */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 shrink-0 rounded" style={{ background: theme.primary }} />
          <span className="truncate text-[9px] font-bold text-slate-700" style={{ fontFamily: `${theme.font}, Inter, sans-serif` }}>
            {storeName.length > 17 ? `${storeName.slice(0, 17)}…` : storeName}
          </span>
        </div>
        <div className="flex gap-1">
          <span className="h-1.5 w-5 rounded-full bg-slate-200" />
          <span className="h-1.5 w-5 rounded-full bg-slate-200" />
          <span className="h-1.5 w-5 rounded-full bg-slate-200" />
        </div>
      </div>
      {/* hero bertema */}
      <div className="relative overflow-hidden px-4 py-5" style={{ background: theme.soft }}>
        {theme.deco === 'organic' && <span className="absolute -right-5 -top-7 h-16 w-16 rounded-full bg-white/60" />}
        {theme.deco === 'gold' && <span className="absolute inset-2 rounded-md border" style={{ borderColor: `${theme.primary}55` }} />}
        {theme.deco === 'burst' && (
          <>
            <span className="absolute -bottom-4 right-2 h-10 w-16 rotate-6 rounded-xl bg-white/70" />
            <span className="absolute -right-3 top-2 h-8 w-8 rounded-full bg-white/70" />
          </>
        )}
        <span className="block h-2.5 w-3/5 rounded-full bg-slate-800/70" />
        <span className="mt-1.5 block h-2 w-4/5 rounded-full bg-slate-400/60" />
        <span className="mt-1.5 block h-2 w-2/3 rounded-full bg-slate-400/40" />
        <span className="mt-3 inline-flex h-5 items-center rounded-md bg-white px-3 shadow-sm">
          <span className="h-1.5 w-8 rounded-full" style={{ background: theme.primary }} />
        </span>
      </div>
      {/* kartu produk */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-slate-100 bg-white p-1.5 shadow-sm">
            <span className="block h-8 rounded-md" style={{ background: theme.soft }} />
            <span className="mt-1.5 block h-1.5 w-3/4 rounded-full bg-slate-200" />
            <span className="mt-1 block h-1.5 w-1/2 rounded-full" style={{ background: `${theme.primary}55` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Preview fullscreen: seluruh website toko dengan tema yang di-preview, tanpa menyimpan apa pun. */
function ThemePreview({ theme, store, data, device, onDevice, onClose, onApply, applying }) {
  const { sections, products, discounts, loading } = data

  const sub = store.theme?.subscription || {}
  const hasActiveSubscription = ['active', 'complimentary'].includes(sub.billingMode)
    && (!sub.renewsAt || new Date(sub.renewsAt).getTime() > Date.now())
  const hasWatermark = !hasActiveSubscription || !['bisnis', 'pro'].includes(sub.plan || 'gratis')

  const visibleSections = sections.filter((s) => s.is_visible)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-200">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
        <button type="button" onClick={onClose} className="btn-ghost px-2 text-sm">
          <ArrowLeft size={18} /> Kembali ke Galeri Tema
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">Preview · Tema {theme.name}</p>
          <p className="hidden text-[11px] text-slate-500 sm:block">Memakai data tokomu sendiri — tidak mengubah tema aktif maupun konten tersimpan.</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5">
            <button type="button" onClick={() => onDevice('desktop')} aria-pressed={device === 'desktop'} className={`rounded p-1.5 ${device === 'desktop' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}><Monitor size={16} /></button>
            <button type="button" onClick={() => onDevice('mobile')} aria-pressed={device === 'mobile'} className={`rounded p-1.5 ${device === 'mobile' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}><Smartphone size={16} /></button>
          </div>
          <button type="button" onClick={onApply} disabled={applying} className="btn-primary px-4 py-2 text-xs font-bold shadow-sm sm:text-sm">
            <Crown size={16} /> {applying ? 'Menerapkan…' : 'Gunakan Tema Ini'}
          </button>
        </div>
      </div>

      {/* Konten preview */}
      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-6">
        <div
          className={`mx-auto overflow-hidden rounded-xl bg-white shadow-xl transition-all ${device === 'mobile' ? 'max-w-[390px]' : 'max-w-6xl'}`}
          style={{ fontFamily: `${theme.font}, Inter, sans-serif` }}
        >
          {loading ? (
            <div className="py-32 text-center text-sm text-slate-400">Memuat pratinjau…</div>
          ) : (
            <>
              <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    {store.logo_url ? (
                      <img src={store.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <span className="rounded-lg p-1.5 text-white" style={{ background: theme.primary }}><StoreIcon size={16} /></span>
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

              {visibleSections.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
                  <Sparkles size={40} className="text-slate-300" />
                  <p className="text-sm text-slate-400">Website toko ini belum memiliki section. Tambahkan di Web Builder untuk melihat preview lebih lengkap.</p>
                </div>
              ) : (
                visibleSections.map((s) => (
                  <SectionRenderer key={s.id} section={s} store={store} products={products} discounts={discounts} primary={theme.primary} />
                ))
              )}

              <footer className="bg-slate-900 py-6 text-center text-xs text-slate-400">
                © {new Date().getFullYear()} {store.name}
                {hasWatermark && (
                  <>
                    {' · '}
                    <span className="text-slate-400 underline underline-offset-2">Dibuat dengan UMKM Builder</span>
                  </>
                )}
              </footer>
            </>
          )}
        </div>
      </main>
    </div>
  )
}