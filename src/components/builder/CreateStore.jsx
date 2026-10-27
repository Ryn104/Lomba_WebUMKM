import { useState } from 'react'
import toast from 'react-hot-toast'
import { Store, Check, X } from 'lucide-react'
import { supabase, PLATFORM_DOMAIN } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { slugify, RESERVED_SLUGS, sanitizePhone } from '../../lib/utils'
import { defaultSections, SECTION_TYPES } from '../store-front/sectionDefs'

/** Form pembuatan toko pertama — memilih nama & alamat (slug) website */
export default function CreateStore({ onCreated }) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [whatsapp, setWhatsapp] = useState('')
  const [busy, setBusy] = useState(false)

  const onName = (v) => {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  const reserved = RESERVED_SLUGS.includes(slug)
  const valid = slug.length >= 3 && !reserved

  const submit = async (e) => {
    e.preventDefault()
    if (!valid) return toast.error('Alamat toko tidak valid')
    setBusy(true)

    const { data: store, error } = await supabase
      .from('stores')
      .insert({ owner_id: user.id, name, slug, whatsapp: whatsapp.replace(/\D/g, '') || null })
      .select()
      .single()

    if (error) {
      setBusy(false)
      return toast.error(error.code === '23505' ? 'Alamat toko sudah dipakai, coba yang lain' : error.message)
    }

    // isi section awal supaya langsung ada kerangka website
    const rows = defaultSections().map((s) => ({
      store_id: store.id,
      type: s.type,
      position: s.position,
      is_visible: true,
      content:
        s.type === 'hero'
          ? { ...SECTION_TYPES.hero.defaults, title: `Selamat Datang di ${name}` }
          : s.type === 'contact'
          ? { ...SECTION_TYPES.contact.defaults, phone: whatsapp }
          : s.content,
    }))
    await supabase.from('store_sections').insert(rows)

    setBusy(false)
    toast.success('Toko berhasil dibuat!')
    onCreated?.(store)
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-lg space-y-5 p-8">
        <div className="text-center">
          <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-700"><Store size={28} /></span>
          <h2 className="mt-3 text-xl font-bold text-slate-900">Buat Toko Anda</h2>
          <p className="text-sm text-slate-500">Website toko akan otomatis tersedia di alamat yang Anda pilih.</p>
        </div>

        <div>
          <label className="label">Nama toko</label>
          <input className="input" required value={name} onChange={(e) => onName(e.target.value)} placeholder="Contoh: Warung Kopi Sari" />
        </div>

        <div>
          <label className="label">Alamat website</label>
          <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
            <span className="bg-slate-100 px-3 py-2 text-sm text-slate-500">{PLATFORM_DOMAIN}/</span>
            <input
              className="w-full px-2 py-2 text-sm text-slate-900 outline-none"
              required
              value={slug}
              onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)) }}
              placeholder="warung-kopi-sari"
            />
            {slug && (valid ? <Check size={16} className="mr-2 text-brand-600" /> : <X size={16} className="mr-2 text-red-600" />)}
          </div>
          {reserved && <p className="mt-1 text-xs text-red-600">Alamat ini dicadangkan sistem.</p>}
        </div>

        <div>
          <label className="label">No. WhatsApp (opsional)</label>
          <input
            className="input"
            value={whatsapp}
            onChange={(e) => setWhatsapp(sanitizePhone(e.target.value))}
            placeholder="628123456789"
            inputMode="numeric"
            maxLength={13}
          />
        </div>

        <button className="btn-primary w-full" disabled={busy || !valid}>{busy ? 'Membuat…' : 'Buat Toko'}</button>
      </form>
    </div>
  )
}
