import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase, PLATFORM_DOMAIN } from '../../lib/supabase'
import { sanitizePhone } from '../../lib/utils'
import ImageUpload from '../ui/ImageUpload'
import { Field } from '../ui/Field'

export default function StoreSettings({ store, setStore }) {
  const [form, setForm] = useState({
    name: store.name,
    description: store.description || '',
    whatsapp: store.whatsapp || '',
    logo_url: store.logo_url || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await supabase
      .from('stores')
      .update({
        name: form.name,
        description: form.description || null,
        whatsapp: form.whatsapp.replace(/\D/g, '') || null,
        logo_url: form.logo_url || null,
      })
      .eq('id', store.id)
      .select()
      .single()
    setSaving(false)
    if (error) return toast.error(error.message)
    setStore(data)
    toast.success('Pengaturan disimpan')
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Pengaturan Toko</h1>
      <form onSubmit={save} className="card space-y-4 p-6">
        <Field label="Logo"><ImageUpload value={form.logo_url} onChange={(v) => setForm({ ...form, logo_url: v })} folder={`logos/${store.id}`} className="h-24 w-24" /></Field>
        <Field label="Nama toko"><input className="input" required value={form.name} onChange={set('name')} placeholder="Contoh: Toko Berkah" /></Field>
        <Field label="Alamat website" hint="Alamat tidak dapat diubah setelah dibuat.">
          <input className="input cursor-not-allowed bg-slate-100 text-slate-600" disabled value={`${PLATFORM_DOMAIN}/${store.slug}`} />
        </Field>
        <Field label="Deskripsi singkat"><textarea rows={3} className="input" value={form.description} onChange={set('description')} placeholder="Ceritakan produk dan keunggulan toko Anda..." /></Field>
        <Field label="No. WhatsApp" hint="Dipakai untuk tombol pesan di halaman produk. Format: 628123456789">
          <input
            className="input"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: sanitizePhone(e.target.value) })}
            inputMode="numeric"
            maxLength={13}
            placeholder="Contoh: 628123456789"
          />
        </Field>
        <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </form>
    </div>
  )
}
