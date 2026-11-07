import { useState } from 'react'
import toast from 'react-hot-toast'
import { ArrowRight, Check, Store, X } from 'lucide-react'
import { supabase, PLATFORM_DOMAIN } from '../../lib/supabase'
import { RESERVED_SLUGS, sanitizePhone, slugify } from '../../lib/utils'
import { defaultSections, SECTION_TYPES } from '../store-front/sectionDefs'

/**
 * Langkah 1 onboarding: buat nama toko + alamat website.
 * Toko langsung disimpan agar tidak hilang bila pengguna menutup tab.
 */
export default function StoreStep({ user, profile, store, onCreated }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [whatsapp, setWhatsapp] = useState(sanitizePhone(profile?.phone || ''))
  const [busy, setBusy] = useState(false)

  const readOnly = Boolean(store)
  const reserved = RESERVED_SLUGS.includes(slug)
  const slugValid = slug.length >= 3 && !reserved
  const phoneValid = /^\d{10,13}$/.test(whatsapp)
  const valid = name.trim().length >= 2 && slugValid && (readOnly || phoneValid)

  const onName = (value) => {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (readOnly) return undefined
    if (!valid) return toast.error('Lengkapi nama toko, alamat website, dan nomor WhatsApp.')
    setBusy(true)

    try {
      const { data: existing } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', slug)
        .limit(1)
        .maybeSingle()
      if (existing) throw new Error('Alamat website sudah dipakai, coba yang lain.')

      const { data: created, error } = await supabase
        .from('stores')
        .insert({ owner_id: user.id, name: name.trim(), slug, whatsapp })
        .select()
        .single()

      if (error) {
        throw new Error(error.code === '23505' ? 'Alamat website sudah dipakai, coba yang lain.' : error.message)
      }

      const rows = defaultSections().map((section) => ({
        store_id: created.id,
        type: section.type,
        position: section.position,
        is_visible: true,
        content:
          section.type === 'hero'
            ? { ...SECTION_TYPES.hero.defaults, title: `Selamat Datang di ${created.name}` }
            : section.content,
      }))
      await supabase.from('store_sections').insert(rows)
      await supabase.from('profiles').update({ phone: whatsapp }).eq('id', user.id)

      toast.success('Toko berhasil dibuat.')
      onCreated?.(created)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (readOnly) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-700"><Store size={24} /></span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Toko Anda sudah dibuat</h2>
            <p className="text-sm text-slate-500">Alamat website tidak dapat diubah setelah dibuat.</p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-500">Nama toko</p>
            <p className="font-semibold text-slate-900">{store.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Alamat website</p>
            <p className="break-all font-mono text-xs font-semibold text-brand-700">{PLATFORM_DOMAIN}/{store.slug}</p>
          </div>
          {store.whatsapp && (
            <div>
              <p className="text-xs font-medium text-slate-500">WhatsApp toko</p>
              <p className="font-semibold text-slate-900">{store.whatsapp}</p>
            </div>
          )}
        </div>

        <button type="button" onClick={() => onCreated?.(store)} className="btn-primary w-full justify-center py-2.5 font-bold">
          Lanjut pilih paket <ArrowRight size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-700"><Store size={24} /></span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Buat nama toko Anda</h2>
          <p className="text-sm text-slate-500">Nama dan alamat website dipakai untuk halaman toko publik Anda.</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="onboarding-store-name">Nama toko</label>
          <input
            id="onboarding-store-name"
            className="input"
            required
            maxLength={80}
            value={name}
            onChange={(event) => onName(event.target.value)}
            placeholder="Contoh: Warung Kopi Sari"
          />
        </div>

        <div>
          <label className="label" htmlFor="onboarding-store-slug">Alamat website</label>
          <div className="flex items-center overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
            <span className="shrink-0 bg-slate-100 px-3 py-2 text-sm text-slate-500">{PLATFORM_DOMAIN}/</span>
            <input
              id="onboarding-store-slug"
              className="w-full px-2 py-2 text-sm text-slate-900 outline-none"
              required
              value={slug}
              onChange={(event) => {
                setSlugTouched(true)
                setSlug(slugify(event.target.value))
              }}
              placeholder="warung-kopi-sari"
            />
            {slug && (slugValid ? <Check size={16} className="mr-2 shrink-0 text-brand-600" /> : <X size={16} className="mr-2 shrink-0 text-red-600" />)}
          </div>
          <p className="mt-1 text-xs text-slate-500">Hanya huruf kecil, angka, dan tanda hubung. Tidak bisa diubah setelah toko dibuat.</p>
          {reserved && <p className="mt-1 text-xs font-medium text-red-600">Alamat ini dicadangkan sistem.</p>}
          {!reserved && slug.length > 0 && slug.length < 3 && <p className="mt-1 text-xs text-red-600">Minimal 3 karakter.</p>}
        </div>

        <div>
          <label className="label" htmlFor="onboarding-whatsapp">No. WhatsApp toko</label>
          <input
            id="onboarding-whatsapp"
            type="tel"
            className="input"
            required
            inputMode="numeric"
            maxLength={13}
            value={whatsapp}
            onChange={(event) => setWhatsapp(sanitizePhone(event.target.value))}
            placeholder="628123456789"
          />
          <p className="mt-1 text-xs text-slate-500">10–13 digit, awali dengan kode negara 62. Dipakai sebagai kontak toko.</p>
        </div>

        <button className="btn-primary w-full justify-center py-2.5 font-bold" disabled={busy || !valid}>
          {busy ? 'Membuat toko…' : <>Simpan & lanjut <ArrowRight size={16} /></>}
        </button>
      </form>
    </div>
  )
}
