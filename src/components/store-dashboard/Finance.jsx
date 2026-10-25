import { useEffect, useState, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { Plus, Trash2, TrendingUp, TrendingDown, Scale, Wallet } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { rupiah, formatDate, todayISO } from '../../lib/utils'
import Modal from '../ui/Modal'
import { Field, StatCard, EmptyState, Spinner } from '../ui/Field'

const INCOME_CATS = ['Penjualan Kasir', 'Penjualan Online', 'Lainnya']
const EXPENSE_CATS = ['Bahan Baku', 'Gaji', 'Sewa', 'Listrik & Air', 'Transportasi', 'Pemasaran', 'Peralatan', 'Lainnya']
const PIE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#64748b']

export default function Finance({ store }) {
  const [rows, setRows] = useState(null)
  const [month, setMonth] = useState(todayISO().slice(0, 7)) // YYYY-MM
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const year = month.slice(0, 4)
    const { data } = await supabase
      .from('finances')
      .select('*')
      .eq('store_id', store.id)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    setRows(data || [])
  }, [store.id, month])

  useEffect(() => { load() }, [load])

  const monthRows = useMemo(() => (rows || []).filter((r) => r.date.startsWith(month)), [rows, month])
  const shown = monthRows.filter((r) => filter === 'all' || r.type === filter)

  const income = monthRows.filter((r) => r.type === 'income').reduce((a, b) => a + Number(b.amount), 0)
  const expense = monthRows.filter((r) => r.type === 'expense').reduce((a, b) => a + Number(b.amount), 0)

  const yearChart = useMemo(() => {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    return names.map((n, i) => {
      const key = `${month.slice(0, 4)}-${String(i + 1).padStart(2, '0')}`
      const r = (rows || []).filter((x) => x.date.startsWith(key))
      return {
        bulan: n,
        Pemasukan: r.filter((x) => x.type === 'income').reduce((a, b) => a + Number(b.amount), 0),
        Pengeluaran: r.filter((x) => x.type === 'expense').reduce((a, b) => a + Number(b.amount), 0),
      }
    })
  }, [rows, month])

  const expenseByCat = useMemo(() => {
    const m = {}
    monthRows.filter((r) => r.type === 'expense').forEach((r) => { m[r.category] = (m[r.category] || 0) + Number(r.amount) })
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [monthRows])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('finances').insert({
      store_id: store.id,
      type: form.type,
      category: form.category,
      amount: Number(form.amount),
      note: form.note || null,
      date: form.date,
    })
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Catatan disimpan')
    setForm(null)
    load()
  }

  const remove = async (r) => {
    if (r.transaction_id) return toast.error('Pemasukan dari kasir tidak bisa dihapus manual')
    if (!confirm('Hapus catatan ini?')) return
    await supabase.from('finances').delete().eq('id', r.id)
    load()
  }

  const exportCSV = () => {
    const head = 'Tanggal,Jenis,Kategori,Jumlah,Catatan'
    const body = shown.map((r) => [r.date, r.type === 'income' ? 'Pemasukan' : 'Pengeluaran', r.category, r.amount, `"${(r.note || '').replace(/"/g, '""')}"`].join(','))
    const blob = new Blob([[head, ...body].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `keuangan-${store.slug}-${month}.csv`
    a.click()
  }

  if (!rows) return <Spinner />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Keuangan</h1>
          <p className="text-sm text-slate-500">Catat pemasukan & pengeluaran toko. Penjualan kasir tercatat otomatis.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="month" className="input w-auto" value={month} onChange={(e) => setMonth(e.target.value)} />
          <button className="btn-secondary" onClick={exportCSV}>Ekspor CSV</button>
          <button className="btn-primary" onClick={() => setForm({ type: 'expense', category: EXPENSE_CATS[0], amount: '', note: '', date: todayISO() })}>
            <Plus size={16} /> Catat
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={TrendingUp} tone="green" label="Pemasukan" value={rupiah(income)} />
        <StatCard icon={TrendingDown} tone="red" label="Pengeluaran" value={rupiah(expense)} />
        <StatCard icon={Scale} tone={income - expense >= 0 ? 'brand' : 'red'} label="Laba / Rugi" value={rupiah(income - expense)} sub={income - expense >= 0 ? 'Untung' : 'Rugi'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Tahun {month.slice(0, 4)}</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={yearChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="bulan" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => (v >= 1e6 ? `${v / 1e6}jt` : v >= 1000 ? `${v / 1000}rb` : v)} />
                <Tooltip formatter={(v) => rupiah(v)} />
                <Legend />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold">Pengeluaran per kategori</h2>
          {expenseByCat.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">Belum ada pengeluaran.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={expenseByCat} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                    {expenseByCat.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => rupiah(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex gap-2 border-b border-slate-100 p-3">
          {[['all', 'Semua'], ['income', 'Pemasukan'], ['expense', 'Pengeluaran']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={`rounded-full px-3 py-1 text-sm font-medium ${filter === v ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{l}</button>
          ))}
        </div>
        {shown.length === 0 ? (
          <EmptyState icon={Wallet} title="Belum ada catatan" desc="Catat pengeluaran atau pemasukan lain di bulan ini." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Catatan</th><th className="px-4 py-3 text-right">Jumlah</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{formatDate(r.date)}</td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3 text-slate-500">{r.note || '-'}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${r.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {r.type === 'income' ? '+' : '-'}{rupiah(r.amount)}
                  </td>
                  <td className="px-2">
                    {!r.transaction_id && <button className="rounded p-1.5 text-red-500 hover:bg-red-50" onClick={() => remove(r)}><Trash2 size={15} /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title="Catat Keuangan" size="sm">
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[['expense', 'Pengeluaran'], ['income', 'Pemasukan']].map(([v, l]) => (
                <button
                  type="button" key={v}
                  onClick={() => setForm({ ...form, type: v, category: (v === 'income' ? INCOME_CATS : EXPENSE_CATS)[0] })}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${form.type === v ? (v === 'income' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-500 bg-red-50 text-red-700') : 'border-slate-200'}`}
                >{l}</button>
              ))}
            </div>
            <Field label="Kategori">
              <select className="input" value={form.category} onChange={set('category')}>
                {(form.type === 'income' ? INCOME_CATS : EXPENSE_CATS).map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Jumlah (Rp)"><input type="number" min="1" required className="input" value={form.amount} onChange={set('amount')} /></Field>
            <Field label="Tanggal"><input type="date" required className="input" value={form.date} onChange={set('date')} /></Field>
            <Field label="Catatan"><input className="input" value={form.note} onChange={set('note')} /></Field>
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
