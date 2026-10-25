import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Globe, ExternalLink, Plus, Monitor, Smartphone, Palette } from 'lucide-react'
import { supabase, PLATFORM_DOMAIN } from '../lib/supabase'
import { useMyStore } from '../hooks/useMyStore'
import { Spinner } from '../components/ui/Field'
import CreateStore from '../components/builder/CreateStore'
import SortableItem from '../components/builder/SortableItem'
import SectionEditor from '../components/builder/SectionEditor'
import SectionRenderer from '../components/store-front/SectionRenderer'
import { SECTION_TYPES } from '../components/store-front/sectionDefs'

export default function BuilderPage() {
  const { store, setStore, loading, reload } = useMyStore()
  if (loading) return <Spinner full />
  if (!store) return <CreateStore onCreated={reload} />
  return <Builder store={store} setStore={setStore} />
}

function Builder({ store, setStore }) {
  const [sections, setSections] = useState([])
  const [products, setProducts] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [device, setDevice] = useState('desktop')
  const [primary, setPrimary] = useState(store.theme?.primary || '#4f46e5')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    ;(async () => {
      const [s, p, d] = await Promise.all([
        supabase.from('store_sections').select('*').eq('store_id', store.id).order('position'),
        supabase.from('products').select('*').eq('store_id', store.id).order('created_at', { ascending: false }),
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

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    mutate((list) => {
      const from = list.findIndex((s) => s.id === active.id)
      const to = list.findIndex((s) => s.id === over.id)
      return arrayMove(list, from, to)
    })
  }

  const addSection = (type) => {
    const s = {
      id: crypto.randomUUID(),
      type,
      content: { ...SECTION_TYPES[type].defaults },
      is_visible: true,
    }
    mutate((l) => [...l, s])
    setSelectedId(s.id)
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

      const patch = { theme: { ...(store.theme || {}), primary } }
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

  const url = `https://${PLATFORM_DOMAIN}/${store.slug}`

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
        <Link to="/dashboard" className="btn-ghost px-2"><ArrowLeft size={18} /></Link>
        <div className="min-w-0">
          <p className="truncate font-bold leading-tight">{store.name}</p>
          <a href={`/${store.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-xs text-slate-500 hover:text-brand-600">
            {PLATFORM_DOMAIN}/{store.slug} <ExternalLink size={11} />
          </a>
        </div>
        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${store.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {store.is_published ? 'Live' : 'Draft'}
        </span>
        {dirty && <span className="text-xs text-amber-600">• belum disimpan</span>}

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden rounded-lg border border-slate-200 p-0.5 sm:flex">
            <button onClick={() => setDevice('desktop')} className={`rounded p-1.5 ${device === 'desktop' ? 'bg-slate-100' : ''}`}><Monitor size={16} /></button>
            <button onClick={() => setDevice('mobile')} className={`rounded p-1.5 ${device === 'mobile' ? 'bg-slate-100' : ''}`}><Smartphone size={16} /></button>
          </div>
          {store.is_published && (
            <button className="btn-ghost" onClick={unpublish}>Jadikan Draft</button>
          )}
          <button className="btn-secondary" disabled={saving || !dirty} onClick={() => save(false)}>
            <Save size={16} /> Simpan
          </button>
          <button className="btn-primary" disabled={saving} onClick={() => save(true)}>
            <Globe size={16} /> {store.is_published ? 'Simpan & Update' : 'Publish'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Kiri: daftar section */}
        <aside className="w-72 shrink-0 space-y-5 overflow-y-auto border-r border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="label">Susunan halaman (seret untuk mengurutkan)</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sections.map((s) => (
                    <SortableItem
                      key={s.id}
                      section={s}
                      selected={s.id === selectedId}
                      onSelect={() => setSelectedId(s.id)}
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
            <p className="label">Tambah section</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SECTION_TYPES).map(([type, def]) => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs font-medium text-slate-600 hover:border-brand-500 hover:text-brand-600"
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
                className="h-9 w-12 cursor-pointer rounded border border-slate-300"
              />
              <input className="input font-mono" value={primary} onChange={(e) => { setPrimary(e.target.value); setDirty(true) }} />
            </div>
          </div>
        </aside>

        {/* Tengah: preview real-time */}
        <main className="min-w-0 flex-1 overflow-auto bg-slate-200 p-4">
          <div
            className={`mx-auto overflow-hidden rounded-lg bg-white shadow-xl transition-all ${device === 'mobile' ? 'max-w-[390px]' : 'max-w-full'}`}
          >
            {sections.filter((s) => s.is_visible).length === 0 ? (
              <p className="py-32 text-center text-slate-400">Tambahkan section dari panel kiri.</p>
            ) : (
              sections
                .filter((s) => s.is_visible)
                .map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`relative cursor-pointer ${s.id === selectedId ? 'outline outline-2 -outline-offset-2 outline-brand-500' : 'hover:outline hover:outline-1 hover:-outline-offset-1 hover:outline-brand-300'}`}
                  >
                    <div className="pointer-events-none">
                      <SectionRenderer section={s} store={store} products={products} discounts={discounts} primary={primary} />
                    </div>
                  </div>
                ))
            )}
          </div>
        </main>

        {/* Kanan: editor */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4">
          {selected ? (
            <SectionEditor
              key={selected.id}
              section={selected}
              onChange={(content) => mutate((l) => l.map((s) => (s.id === selected.id ? { ...s, content } : s)))}
            />
          ) : (
            <div className="py-16 text-center text-sm text-slate-400">Pilih section untuk mengedit teks, warna, dan gambar.</div>
          )}
        </aside>
      </div>
    </div>
  )
}
