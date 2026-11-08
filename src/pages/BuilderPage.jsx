import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Globe, ExternalLink, Plus, Monitor, Tablet, Smartphone, Palette, Sparkles, X, LayoutList, Eye, SlidersHorizontal } from 'lucide-react'
import { supabase, PLATFORM_DOMAIN } from '../lib/supabase'
import { resolveTheme } from '../components/builder/themes'
import { DEFAULT_LAYOUTS, LAYOUT_OPTIONS } from '../components/store-front/sectionDefs'
import { useMyStore } from '../hooks/useMyStore'
import { useSubscription } from '../hooks/useSubscription'
import { Spinner } from '../components/ui/Field'
import CreateStore from '../components/builder/CreateStore'
import SortableItem from '../components/builder/SortableItem'
import SectionEditor from '../components/builder/SectionEditor'
import BuilderDock from '../components/builder/BuilderDock'
import DevicePreview from '../components/builder/DevicePreview'
import { StorefrontFooter, StorefrontHeader } from '../components/store-front/HeaderFooter'
import SectionRenderer from '../components/store-front/SectionRenderer'
import { SECTION_TYPES } from '../components/store-front/sectionDefs'
import UpgradeModal from '../components/subscription/UpgradeModal'

export default function BuilderPage() {
  const { store, setStore, loading, reload } = useMyStore()
  if (loading) return <Spinner full />
  if (!store) return <CreateStore onCreated={reload} />
  return <Builder store={store} setStore={setStore} />
}

// Tab panel untuk mobile / tablet (di layar lg ke atas ketiga panel tampil berdampingan).
// Urutan penting untuk BuilderDock: [kiri, tengah (tombol mengambang), kanan]
const TABS = [
  { id: 'sections', label: 'Susunan', icon: LayoutList },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'edit', label: 'Edit', icon: SlidersHorizontal },
]

// Pilihan ukuran preview (lebar virtual tiap perangkat ada di DevicePreview)
const DEVICE_BUTTONS = [
  { id: 'desktop', label: 'Preview desktop', icon: Monitor },
  { id: 'tablet', label: 'Preview tablet', icon: Tablet },
  { id: 'mobile', label: 'Preview mobile', icon: Smartphone },
]

const isCompactScreen = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches

function Builder({ store, setStore }) {
  const { plan, upgrade } = useSubscription(store, setStore)
  const isFree = plan === 'gratis'
  const theme = resolveTheme(store)
  const sub = store.theme?.subscription || {}
  const hasActiveSubscription = ['active', 'complimentary'].includes(sub.billingMode) && (!sub.renewsAt || new Date(sub.renewsAt).getTime() > Date.now())
  const hasWatermark = !hasActiveSubscription || !['bisnis', 'pro'].includes(sub.plan || 'gratis')
  const [onboardDismissed, setOnboardDismissed] = useState(false)

  const [sections, setSections] = useState([])
  const [products, setProducts] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [device, setDevice] = useState('desktop')
  const [tab, setTab] = useState('sections') // hanya berlaku di mobile / tablet
  const [primary, setPrimary] = useState(store.theme?.primary || '#047857')
  const [headerLayout, setHeaderLayout] = useState(store.theme?.headerLayout || theme.headerLayout)
  const [footerLayout, setFooterLayout] = useState(store.theme?.footerLayout || theme.footerLayout)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    ; (async () => {
      const [s, p, d] = await Promise.all([
        supabase.from('store_sections').select('*').eq('store_id', store.id).order('position'),
        supabase.from('products').select('*, categories(name)').eq('store_id', store.id).order('created_at', { ascending: false }),
        supabase.from('discounts').select('*').eq('store_id', store.id).eq('is_active', true),
      ])
      setSections(s.data || [])
      setProducts(p.data || [])
      setDiscounts(d.data || [])
      setSelectedId(s.data?.[0]?.id ?? null)
      setLoading(false)
    })()
  }, [store.id])

  // peringatan sebelum menutup tab jika ada perubahan belum disimpan
  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const mutate = useCallback((fn) => {
    setSections(fn)
    setDirty(true)
  }, [])

  // Di mobile: setelah memilih section, langsung buka tab Edit
  const selectSection = (id) => {
    setSelectedId(id)
    if (isCompactScreen()) setTab('edit')
  }

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    mutate((list) => {
      const from = list.findIndex((s) => s.id === active.id)
      const to = list.findIndex((s) => s.id === over.id)
      return arrayMove(list, from, to)
    })
  }

  const addSection = (type) => {
    if (isFree && sections.length >= 4) {
      setUpgradeOpen(true)
      return
    }

    const s = {
      id: crypto.randomUUID(),
      type,
      content: { ...SECTION_TYPES[type].defaults, layout: theme.layouts[type] || DEFAULT_LAYOUTS[type] },
      is_visible: true,
    }
    mutate((l) => [...l, s])
    selectSection(s.id)
  }

  const removeSection = (id) => {
    mutate((l) => l.filter((s) => s.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const selected = sections.find((s) => s.id === selectedId)

  const save = async (publish) => {
    setSaving(true)
    try {
      const rows = sections.map((s, i) => ({
        id: s.id, store_id: store.id, type: s.type, position: i, content: s.content, is_visible: s.is_visible,
      }))

      // hapus section yang sudah dibuang
      const { data: existing } = await supabase.from('store_sections').select('id').eq('store_id', store.id)
      const keep = new Set(rows.map((r) => r.id))
      const toDelete = (existing || []).filter((e) => !keep.has(e.id)).map((e) => e.id)
      if (toDelete.length) {
        const { error } = await supabase.from('store_sections').delete().in('id', toDelete)
        if (error) throw error
      }
      if (rows.length) {
        const { error } = await supabase.from('store_sections').upsert(rows)
        if (error) throw error
      }

      const patch = { theme: { ...(store.theme || {}), primary, headerLayout, footerLayout } }
      if (publish) patch.is_published = true
      const { data, error } = await supabase.from('stores').update(patch).eq('id', store.id).select().single()
      if (error) throw error
      setStore(data)
      setDirty(false)
      toast.success(publish ? 'Website dipublikasikan! 🎉' : 'Perubahan disimpan')
    } catch (err) {
      toast.error('Gagal menyimpan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const unpublish = async () => {
    const { data, error } = await supabase.from('stores').update({ is_published: false }).eq('id', store.id).select().single()
    if (error) return toast.error(error.message)
    setStore(data)
    toast.success('Website di-nonaktifkan (draft)')
  }

  if (loading) return <Spinner full />

  const visibleSections = sections.filter((s) => s.is_visible)

  return (
    <div className="app-bg flex h-[100dvh] flex-col bg-slate-50">
      {/* Top bar: baris 1 = identitas toko, baris 2 (mobile) = tombol aksi */}
      <header className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-2.5">
        <Link to="/dashboard" className="btn-ghost shrink-0 !px-2" aria-label="Kembali ke dashboard"><ArrowLeft size={18} /></Link>
        <div className="min-w-0 flex-1 lg:flex-none">
          <p className="truncate font-bold leading-tight text-slate-900">{store.name}</p>
          <a href={`/${store.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-xs font-medium text-slate-500 hover:text-brand-700">
            <span className="truncate">{PLATFORM_DOMAIN}/{store.slug}</span> <ExternalLink size={11} className="shrink-0" />
          </a>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold lg:ml-2 ${store.is_published ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
          {store.is_published ? 'Live' : 'Draft'}
        </span>
        {dirty && (
          <>
            <span className="hidden text-xs font-medium text-amber-800 sm:inline">• belum disimpan</span>
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500 sm:hidden" title="Belum disimpan" aria-label="Belum disimpan" />
          </>
        )}

        {/* Tema aktif: chip */}
        <span className="hidden items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 lg:inline-flex" title="Tema website yang sedang digunakan">
          <Palette size={13} /> Tema: <b className="font-bold">{theme.preset ? theme.preset.name : 'Kustom'}</b>
        </span>

        {/* Aksi: di mobile turun ke baris sendiri dan melebar penuh */}
        <div className="order-last flex w-full items-center gap-2 lg:order-none lg:ml-auto lg:w-auto">
          <Link to="/builder/tema" className="btn-secondary shrink-0 justify-center text-xs sm:text-sm" aria-label={theme.preset ? 'Ganti Tema' : 'Jelajahi Tema'}>
            <Palette size={16} />
            <span className="sm:hidden">Tema</span>
            <span className="hidden sm:inline">{theme.preset ? 'Ganti Tema' : 'Jelajahi Tema'}</span>
          </Link>
          <div className="hidden rounded-lg border border-slate-200 p-0.5 sm:flex">
            {DEVICE_BUTTONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setDevice(id)}
                aria-label={label}
                title={label}
                aria-pressed={device === id}
                className={`rounded p-1.5 ${device === id ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
          {store.is_published && (
            <button className="btn-ghost hidden lg:inline-flex" onClick={unpublish}>Jadikan Draft</button>
          )}
          <button className="btn-secondary min-w-0 flex-1 justify-center lg:flex-none" disabled={saving || !dirty} onClick={() => save(false)}>
            <Save size={16} /> Simpan
          </button>
          <button className="btn-primary min-w-0 flex-1 justify-center lg:flex-none" disabled={saving} onClick={() => save(true)}>
            <Globe size={16} />
            <span className="sm:hidden">{store.is_published ? 'Update' : 'Publish'}</span>
            <span className="hidden sm:inline">{store.is_published ? 'Simpan & Update' : 'Publish'}</span>
          </button>
        </div>
      </header>

      {/* Onboarding singkat — non-blokir; semua fitur builder tetap bisa diakses */}
      {!store.theme?.mode && !onboardDismissed && (
        <div className="flex flex-wrap items-start gap-2.5 border-b border-brand-100 bg-brand-50/80 px-3 py-2.5 sm:px-4">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-brand-700" />
          <p className="me-auto min-w-0 flex-1 text-xs leading-relaxed text-slate-700 sm:text-sm">
            <b className="font-bold text-slate-900">Pertama kali di Web Builder?</b> Pilih desain website favoritmu di
            Galeri Tema — <b className="font-bold">bisa diganti kapan saja</b> tanpa menghapus isian tokomu, dan tidak wajib dipilih sekarang.
          </p>
          <Link to="/builder/tema" className="btn-primary shrink-0 px-3 py-1.5 text-xs font-bold">
            <Palette size={13} /> Pilih Tema
          </Link>
          <button type="button" onClick={() => setOnboardDismissed(true)} aria-label="Tutup onboarding" className="rounded-lg p-1 text-slate-400 hover:bg-brand-100 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Kiri: daftar section (tab "Susunan" di mobile) */}
        {/* pb-28 memberi ruang agar konten paling bawah tidak tertutup dock (hanya di mobile) */}
        <aside
          className={`${tab === 'sections' ? 'block' : 'hidden'} w-full shrink-0 space-y-5 overflow-y-auto overscroll-contain bg-slate-50 p-4 pb-28 lg:block lg:w-72 lg:border-r lg:border-slate-200 lg:pb-4`}
        >
          <div>
            <div className="flex items-center justify-between">
              <p className="label">Susunan halaman</p>
              {isFree && (
                <span className={`text-[11px] font-semibold ${sections.length >= 4 ? 'text-red-600' : 'text-slate-500'}`}>
                  {sections.length}/4 section
                </span>
              )}
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="mt-1 space-y-2">
                  {sections.map((s) => (
                    <SortableItem
                      key={s.id}
                      section={s}
                      selected={s.id === selectedId}
                      onSelect={() => selectSection(s.id)}
                      onToggle={() => mutate((l) => l.map((x) => (x.id === s.id ? { ...x, is_visible: !x.is_visible } : x)))}
                      onDelete={() => removeSection(s.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {sections.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Belum ada section. Tambahkan di bawah.</p>}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="label">Tambah section</p>
              {isFree && sections.length >= 4 && (
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="text-[11px] font-bold text-brand-700 hover:underline"
                >
                  Buka semua section
                </button>
              )}
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
              {Object.entries(SECTION_TYPES).map(([type, def]) => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs font-medium text-slate-700 transition hover:border-brand-600 hover:text-brand-700 active:scale-95"
                >
                  <def.icon size={18} /> {def.label}
                  <Plus size={12} className="text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label flex items-center gap-1"><Palette size={12} /> Warna utama toko</p>
            <div className="flex items-center gap-2">
              <input
                type="color" value={primary}
                onChange={(e) => { setPrimary(e.target.value); setDirty(true) }}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-300 p-0.5"
              />
              <input className="input font-mono" placeholder="#047857" value={primary} onChange={(e) => { setPrimary(e.target.value); setDirty(true) }} />
            </div>
          </div>

          <div>
            <p className="label" style={{ marginBottom: '0.25rem' }}>Header &amp; Footer</p>
            <select
              className="input"
              value={headerLayout}
              onChange={(e) => { setHeaderLayout(e.target.value); setDirty(true) }}
              aria-label="Layout header"
            >
              {LAYOUT_OPTIONS.header.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <select
              className="input mt-2"
              value={footerLayout}
              onChange={(e) => { setFooterLayout(e.target.value); setDirty(true) }}
              aria-label="Layout footer"
            >
              {LAYOUT_OPTIONS.footer.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">Tersimpan bersama perubahan lain (tombol Simpan).</p>
          </div>

          {/* Mobile: "Jadikan Draft" dipindah ke sini supaya header tidak penuh */}
          {store.is_published && (
            <button type="button" className="btn-secondary w-full justify-center lg:hidden" onClick={unpublish}>
              Jadikan Draft
            </button>
          )}
        </aside>

        {/* Tengah: preview real-time (tab "Preview" di mobile) */}
        <main
          className={`${tab === 'preview' ? 'block' : 'hidden'} min-w-0 flex-1 overflow-hidden bg-slate-200/80 p-2 pb-28 sm:p-4 sm:pb-28 lg:block lg:pb-4`}
        >
          {/* Dirender di dalam iframe agar breakpoint (sm/md/lg) mengikuti lebar perangkat yang dipilih */}
          <DevicePreview device={device}>
            <div data-light-zone className="bg-white">
              <div className="pointer-events-none">
                <StorefrontHeader store={store} sections={visibleSections} primary={primary} layout={headerLayout} />
              </div>
              {visibleSections.length === 0 ? (
                <p className="px-4 py-24 text-center text-slate-400">
                  Belum ada section yang tampil. Tambahkan atau tampilkan section dari daftar Susunan.
                </p>
              ) : (
                visibleSections.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => selectSection(s.id)}
                    className={`relative cursor-pointer transition ${s.id === selectedId ? 'outline outline-2 -outline-offset-2 outline-brand-600' : 'hover:outline hover:outline-1 hover:-outline-offset-1 hover:outline-brand-400'}`}
                  >
                    <div className="pointer-events-none">
                      <SectionRenderer section={s} store={store} products={products} discounts={discounts} primary={primary} layout={theme.layouts[s.type]} />
                    </div>
                  </div>
                ))
              )}
              <div className="pointer-events-none">
                <StorefrontFooter store={store} sections={visibleSections} primary={primary} layout={footerLayout} hasWatermark={hasWatermark} />
              </div>
            </div>
          </DevicePreview>
        </main>

        {/* Kanan: editor (tab "Edit" di mobile) */}
        <aside
          className={`${tab === 'edit' ? 'block' : 'hidden'} w-full shrink-0 overflow-y-auto overscroll-contain bg-white p-4 pb-28 lg:block lg:w-80 lg:border-l lg:border-slate-200 lg:pb-4`}
        >
          {selected ? (
            <SectionEditor
              key={selected.id}
              section={selected}
              store={store}
              themeLayout={theme.layouts[selected.type]}
              themeColor={theme.preset?.primary || primary}
              themeSoft={theme.preset?.soft || '#ECFDF5'}
              onChange={(content) => mutate((l) => l.map((s) => (s.id === selected.id ? { ...s, content } : s)))}
            />
          ) : (
            <div className="py-16 text-center text-sm text-slate-400">
              Pilih section untuk mengedit teks, warna, dan gambar.
              <button type="button" className="btn-secondary mx-auto mt-4 lg:hidden" onClick={() => setTab('sections')}>
                <LayoutList size={16} /> Buka Susunan
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile / tablet: dock navigasi (sama seperti sidebar dashboard) */}
      <BuilderDock tabs={TABS} active={tab} onChange={setTab} />

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        targetPlan="bisnis"
        onSuccess={({ targetPlan, period, method, amount }) => upgrade({ targetPlan, period, method, amount })}
      />
    </div>
  )
}