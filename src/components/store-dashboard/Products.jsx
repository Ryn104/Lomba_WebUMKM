import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Package, Search, Tags } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { rupiah } from '../../lib/utils'
import Modal from '../ui/Modal'
import ImageUpload from '../ui/ImageUpload'
import { Field, EmptyState, Spinner } from '../ui/Field'
import ProdukImage from '../ui/ProductImage'

const empty = { name: '', description: '', price: '', cost_price: '', stock: '', category_id: '', image_url: '', is_active: true }

export default function Products({ store }) {
  const [products, setProducts] = useState(null)
  const [categories, setCategories] = useState([])
  const [q, setQ] = useState('')
  const [form, setForm] = useState(null) // null = tertutup
  const [catOpen, setCatOpen] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([
      supabase.from('products').select('*, categories(name)').eq('store_id', store.id).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('store_id', store.id).order('name'),
    ])
    setProducts(p.data || [])
    setCategories(c.data || [])
  }, [store.id])

  useEffect(() => { load() }, [load])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      store_id: store.id,
      name: form.name,
      description: form.description || null,
      price: Number(form.price) || 0,
      cost_price: Number(form.cost_price) || 0,
      stock: Number(form.stock) || 0,
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      is_active: form.is_active,
    }
    const { error } = form.id
      ? await supabase.from('products').update(payload).eq('id', form.id)
      : await supabase.from('products').insert(payload)
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success(form.id ? 'Produk diperbarui' : 'Produk ditambahkan — otomatis tampil di website')
    setForm(null)
    load()
  }

  const remove = async (p) => {
    if (!confirm(`Hapus produk “${p.name}”?`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) return toast.error(error.message)
    toast.success('Produk dihapus')
    load()
  }

  const addCategory = async (e) => {
    e.preventDefault()
    if (!newCat.trim()) return
    const { error } = await supabase.from('categories').insert({ store_id: store.id, name: newCat.trim() })
    if (error) return toast.error(error.message)
    setNewCat('')
    load()
  }

  const removeCategory = async (id) => {
    await supabase.from('categories').delete().eq('id', id)
    load()
  }

  if (!products) return <Spinner />

  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Produk</h1>
          <p className="text-sm text-slate-500">Produk yang aktif otomatis tampil di section Produk website Anda.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setCatOpen(true)}><Tags size={16} /> Kategori</button>
          <button className="btn-primary" onClick={() => setForm({ ...empty })}><Plus size={16} /> Tambah Produk</button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        <input className="input pl-9" placeholder="Cari produk…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {list.length === 0 ? (
          <EmptyState icon={Package} title="Belum ada produk" desc="Klik “Tambah Produk” untuk mulai berjualan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Harga</th>
                  <th className="px-4 py-3 text-right">Stok</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            <ProdukImage src={p.image_url} />
                        </div>
                        <span className="font-medium text-slate-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.categories?.name || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{rupiah(p.price)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${p.stock <= 5 ? 'font-bold text-red-600' : 'text-slate-800'}`}>{p.stock}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.is_active ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#F1F5F9] text-[#334155]'}`}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button className="rounded p-1.5 hover:bg-slate-100" onClick={() => setForm({ ...p, category_id: p.category_id || '', description: p.description || '', image_url: p.image_url || '' })}>
                          <Pencil size={15} />
                        </button>
                        <button className="rounded p-1.5 text-red-600 hover:bg-red-50" onClick={() => remove(p)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal produk */}
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit Produk' : 'Tambah Produk'} size="lg">
        {form && (
          <form id="product-form" onSubmit={save} className="space-y-4">
            <Field label="Foto produk">
              <ImageUpload value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} folder={`products/${store.id}`} />
            </Field>
            <Field label="Nama produk"><input className="input" required value={form.name} onChange={set('name')} /></Field>
            <Field label="Deskripsi"><textarea rows={3} className="input" value={form.description} onChange={set('description')} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Harga jual (Rp)"><input type="number" min="0" required className="input" value={form.price} onChange={set('price')} /></Field>
              <Field label="Harga modal (Rp)"><input type="number" min="0" className="input" value={form.cost_price} onChange={set('cost_price')} /></Field>
              <Field label="Stok"><input type="number" min="0" required className="input" value={form.stock} onChange={set('stock')} /></Field>
            </div>
            <Field label="Kategori">
              <select className="input" value={form.category_id} onChange={set('category_id')}>
                <option value="">Tanpa kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Tampilkan di website & kasir
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setForm(null)}>Batal</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal kategori */}
      <Modal open={catOpen} onClose={() => setCatOpen(false)} title="Kelola Kategori" size="sm">
        <form onSubmit={addCategory} className="flex gap-2">
          <input className="input" placeholder="Nama kategori baru" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <button className="btn-primary"><Plus size={16} /></button>
        </form>
        <ul className="mt-4 divide-y divide-slate-100">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between py-2 text-sm text-slate-800">
              {c.name}
              <button className="text-red-600 hover:text-red-700" onClick={() => removeCategory(c.id)}><Trash2 size={15} /></button>
            </li>
          ))}
          {categories.length === 0 && <li className="py-4 text-center text-sm text-slate-400">Belum ada kategori.</li>}
        </ul>
      </Modal>
    </div>
  )
}
