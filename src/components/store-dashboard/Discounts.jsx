import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Percent } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { rupiah, formatDate, todayISO } from '../../lib/utils'
import Modal from '../ui/Modal'
import { Field, EmptyState, Spinner } from '../ui/Field'
import MoneyInput from '../ui/MoneyInput'

const empty = { name: '', type: 'percent', value: '', product_id: '', start_date: '', end_date: '', is_active: true }

export default function Discounts({ store }) {
  const [list, setList] = useState(null)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const [d, p] = await Promise.all([
      supabase.from('discounts').select('*, products(name)').eq('store_id', store.id).order('created_at', { ascending: false }),
      supabase.from('products').select('id,name,price').eq('store_id', store.id).order('name'),
    ])
    setList(d.data || [])
    setProducts(p.data || [])
  }, [store.id])

  useEffect(() => { load() }, [load])

  const save = async (e) => {
    e.preventDefault()
    const value = Number(form.value)
    if (form.type === 'percent' && (value <= 0 || value > 100)) return toast.error('Persen harus 1–100')
    if (form.start_date && form.end_date && form.end_date < form.start_date) return toast.error('Tanggal akhir sebelum tanggal mulai')
    setSaving(true)
    const payload = {
      store_id: store.id,
      name: form.name,
      type: form.type,
      value,
      product_id: form.product_id || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: form.is_active,
    }
    const { error } = form.id
      ? await supabase.from('discounts').update(payload).eq('id', form.id)
      : await supabase.from('discounts').insert(payload)
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Diskon disimpan')
    setForm(null)
    load()
  }

  const toggle = async (d) => {
    await supabase.from('discounts').update({ is_active: !d.is_active }).eq('id', d.id)
    load()
  }

  const remove = async (d) => {
    if (!confirm(`Hapus diskon “${d.name}”?`)) return
    await supabase.from('discounts').delete().eq('id', d.id)
    toast.success('Diskon dihapus')
    load()
  }

  if (!list) return <Spinner />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const today = todayISO()

  const status = (d) => {
    if (!d.is_active) return ['Nonaktif', 'bg-[#F1F5F9] text-[#334155]']
    if (d.start_date && d.start_date > today) return ['Terjadwal', 'bg-[#DBEAFE] text-[#1D4ED8]']
    if (d.end_date && d.end_date < today) return ['Berakhir', 'bg-[#FEE2E2] text-[#991B1B]']
    return ['Berjalan', 'bg-[#DCFCE7] text-[#166534]']
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diskon</h1>
          <p className="text-sm text-slate-500">Diskon otomatis berlaku di website dan di kasir.</p>
        </div>
        <button className="btn-primary" onClick={() => setForm({ ...empty })}><Plus size={16} /> Buat Diskon</button>
      </div>

      <div className="card overflow-hidden">
        {list.length === 0 ? (
          <EmptyState icon={Percent} title="Belum ada diskon" desc="Buat diskon persen atau nominal untuk semua produk atau produk tertentu." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Potongan</th>
                  <th className="px-4 py-3">Berlaku untuk</th>
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((d) => {
                  const [label, cls] = status(d)
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{d.name}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{d.type === 'percent' ? `${Number(d.value)}%` : rupiah(d.value)}</td>
                      <td className="px-4 py-3 text-slate-500">{d.products?.name || 'Semua produk'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {d.start_date || d.end_date ? `${formatDate(d.start_date)} – ${formatDate(d.end_date)}` : 'Tanpa batas'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggle(d)} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`} title="Klik untuk aktif/nonaktif">
                          {label}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button className="rounded p-1.5 hover:bg-slate-100" onClick={() => setForm({ ...d, product_id: d.product_id || '', start_date: d.start_date || '', end_date: d.end_date || '' })}><Pencil size={15} /></button>
                          <button className="rounded p-1.5 text-red-600 hover:bg-red-50" onClick={() => remove(d)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit Diskon' : 'Buat Diskon'}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Nama diskon"><input className="input" required value={form.name} onChange={set('name')} placeholder="Promo Akhir Pekan" /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Jenis">
                <select className="input" value={form.type} onChange={set('type')}>
                  <option value="percent">Persen (%)</option>
                  <option value="nominal">Nominal (Rp)</option>
                </select>
              </Field>
              <Field label={form.type === 'percent' ? 'Besar (%)' : 'Besar (Rp)'}>
                {form.type === 'nominal' ? (
                  <MoneyInput min="1" required value={form.value} onChange={(value) => setForm({ ...form, value })} placeholder="Contoh: 10.000" />
                ) : (
                  <input type="number" min="1" max="100" required className="input" value={form.value} onChange={set('value')} placeholder="Contoh: 10" />
                )}
              </Field>
            </div>
            <Field label="Berlaku untuk">
              <select className="input" value={form.product_id} onChange={set('product_id')}>
                <option value="">Semua produk</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mulai (opsional)"><input type="date" className="input" value={form.start_date} onChange={set('start_date')} /></Field>
              <Field label="Berakhir (opsional)"><input type="date" className="input" value={form.end_date} onChange={set('end_date')} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Aktif
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setForm(null)}>Batal</button>
              <button className="btn-primary" disabled={saving}>Simpan</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
