import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Crown, Eye, Monitor, Palette, Smartphone, Sparkles, Store as StoreIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useMyStore } from '../hooks/useMyStore'
import { Spinner } from '../components/ui/Field'
import CreateStore from '../components/builder/CreateStore'
import SectionRenderer from '../components/store-front/SectionRenderer'
import LayoutThumb from '../components/store-front/layoutThumbs'
import { StorefrontFooter, StorefrontHeader } from '../components/store-front/HeaderFooter'
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

  /**
   * Terapkan tema kategori: set identitas visual (primary/font/mode) DAN
   * tulis kombinasi layout default tema ke SETIAP section (content.layout).
   * Konten section digeser dengan spread — tidak ada data yang hilang/dibuat ulang.
   */
  const applyTheme = async (theme) => {
    if (applying) return
    if (activeTheme && activeTheme.id !== theme.id) {
      const ok = window.confirm(
        `Ganti tema menjadi "${theme.name}"?\n\nKombinasi layout khas tema ini akan diterapkan pada semua section. ` +
        'Teks, gambar, dan datamu tetap tersimpan — tampilannya yang disesuaikan. Tetap lanjut?'
      )
      if (!ok) return
    }
    setApplying(true)
    try {
      // 1) theme baru + hapus pilihan header/footer kustom (ikut default tema)
      const { headerLayout: _h, footerLayout: _f, ...restTheme } = store.theme || {}
      const nextTheme = { ...restTheme, primary: theme.primary, font: theme.font, mode: theme.id }
      const { data: updated, error: themeError } = await supabase
        .from('stores').update({ theme: nextTheme }).eq('id', store.id).select().single()
      if (themeError) throw themeError
      setStore(updated)

      // 2) peta layout tema -> semua section milik pengguna (semua, termasuk yang disembunyikan)
      const { data: allSections, error: secError } = await supabase
        .from('store_sections').select('id, content, type').eq('store_id', store.id)
      if (secError) throw secError
      await Promise.all(
        (allSections || []).map((row) =>
          supabase
            .from('store_sections')
            .update({ content: { ...(row.content || {}), layout: theme.layouts[row.type] } })
            .eq('id', row.id)
        )
      )

      setPreviewTheme(null)
      toast.success(`Tema "${theme.name}" diterapkan! Layout khas tema sudah dipadukan ke section tokomu.`)
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
              Setiap kategori bisnis punya karakter desain sendiri — struktur section, komposisi layout, dan dalamnya
              warna &amp; tipografi. Pratinjau dengan datamu sendiri, terapkan kapan saja. Konten tokomu tetap tersimpan.
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
            Semua tema bawaan gratis sesuai hak akses paketmu. Setelah tema diterapkan, kamu tetap bebas mengganti layar
            (layout) tiap section lewat <b>Ubah Layout</b> di editor Web Builder.
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
        {active && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-bold text-white shadow">
            <Check size={11} /> Sedang Digunakan
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-bold text-slate-900">{theme.name}</h3>
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

/**
 * Thumbnail tema: disusun dari LayoutThumb nyata sesuai kombinasi layout karakter
 * tema (header, hero, produk, galeri, footer) — bukan gambar dekoratif acak.
 */
function ThemeThumb({ theme, storeName }) {
  const { primary, soft, layouts } = theme
  const fontFamily = `${theme.font}, Inter, sans-serif`
  return (
    <div className="aspect-[4/3] w-full select-none overflow-hidden bg-white">
      {/* header sesuai layout header tema */}
      <div className="border-b border-slate-100">
        <LayoutThumb type="header" layout={layouts.header} color={primary} soft={soft} text="#475569" className="h-8" />
      </div>
      {/* nama toko + hero sesuai layout hero tema */}
      <div className="px-3 pt-2">
        <p className="truncate text-[10px] font-bold text-slate-500" style={{ fontFamily }}>
          {storeName.length > 22 ? `${storeName.slice(0, 22)}…` : storeName}
        </p>
      </div>
      <LayoutThumb type="hero" layout={layouts.hero} color={primary} soft={soft} text="#475569" className="mx-3 mt-1.5 h-20 rounded-md border border-slate-100" />
      {/* produk sesuai layout produk tema */}
      <LayoutThumb type="products" layout={layouts.products} color={primary} soft={soft} text="#475569" className="mx-3 mt-1.5 h-16 rounded-md border border-slate-100" />
      {/* footer sesuai layout footer tema */}
      <LayoutThumb type="footer" layout={layouts.footer} color={primary} soft={soft} text="#94a3b8" className="mt-2 h-8" />
    </div>
  )
}

/** Preview fullscreen: seluruh website dengan kombinasi layout tema, tanpa menyimpan apa pun. */
function ThemePreview({ theme, store, data, device, onDevice, onClose, onApply, applying }) {
  const { sections, products, discounts, loading } = data

  const sub = store.theme?.subscription || {}
  const hasActiveSubscription = ['active', 'complimentary'].includes(sub.billingMode)
    && (!sub.renewsAt || new Date(sub.renewsAt).getTime() > Date.now())
  const hasWatermark = !hasActiveSubscription || !['bisnis', 'pro'].includes(sub.plan || 'gratis')

  const visibleSections = sections.filter((s) => s.is_visible)
  // Layout efektif: pilihan kustom pengguna (content.layout) menang; selain itu default tema kandidat.
  const effective = (s) => s.content?.layout || theme.layouts[s.type]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-200">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
        <button type="button" onClick={onClose} className="btn-ghost px-2 text-sm">
          <ArrowLeft size={18} /> Kembali ke Galeri Tema
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">Preview · {theme.name}</p>
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
              <StorefrontHeader store={store} sections={visibleSections} primary={theme.primary} layout={theme.layouts.header} />
              {visibleSections.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
                  <Sparkles size={40} className="text-slate-300" />
                  <p className="text-sm text-slate-400">Website toko ini belum memiliki section. Tambahkan di Web Builder untuk melihat preview lebih lengkap.</p>
                </div>
              ) : (
                visibleSections.map((s) => (
                  <SectionRenderer key={s.id} section={s} store={store} products={products} discounts={discounts} primary={theme.primary} layout={effective(s)} />
                ))
              )}
              <StorefrontFooter store={store} sections={visibleSections} primary={theme.primary} layout={theme.layouts.footer} hasWatermark={hasWatermark} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}
