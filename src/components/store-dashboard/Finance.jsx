import { useEffect, useState, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Plus, Trash2, TrendingUp, TrendingDown, Scale, Wallet, FileSpreadsheet, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { rupiah, formatDate, todayISO } from '../../lib/utils'
import Modal from '../ui/Modal'
import { Field, StatCard, EmptyState, Spinner } from '../ui/Field'
import { useSubscription } from '../../hooks/useSubscription'
import LockedFeatureCard from '../subscription/LockedFeatureCard'
import UpgradeModal from '../subscription/UpgradeModal'

const INCOME_CATS = ['Penjualan Kasir', 'Penjualan Online', 'Lainnya']
const EXPENSE_CATS = ['Bahan Baku', 'Gaji', 'Sewa', 'Listrik & Air', 'Transportasi', 'Pemasaran', 'Peralatan', 'Lainnya']
const PIE = ['#047857', '#10b981', '#059669', '#34d399', '#0d9488', '#0284c7', '#f59e0b', '#64748b']

export default function Finance({ store, setStore }) {
  const { plan, upgrade } = useSubscription(store, setStore)
  const isPro = plan === 'pro'

  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'advanced'
  const [upgradeOpen, setUpgradeOpen] = useState(false)
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
    monthRows.filter((r) => r.type === 'expense').forEach((r) => {
      m[r.category] = (m[r.category] || 0) + Number(r.amount)
    })
    return Object.entries(m).map(([name, value]) => ({ name, value }))
  }, [monthRows])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      store_id: store.id,
      type: form.type,
      category: form.category,
      amount: Number(form.amount) || 0,
      date: form.date,
      note: form.note || null,
    }
    const { error } = await supabase.from('finances').insert(payload)
    setSaving(false)
    if (error) return toast.error(error.message)
    toast.success('Catatan keuangan disimpan')
    setForm(null)
    load()
  }

  const remove = async (r) => {
    if (!confirm('Hapus catatan ini?')) return
    await supabase.from('finances').delete().eq('id', r.id)
    toast.success('Catatan dihapus')
    load()
  }

  const handleExportExcel = () => {
    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csv = [
      ['Tanggal', 'Jenis', 'Kategori', 'Jumlah', 'Catatan'],
      ...monthRows.map((row) => [row.date, row.type === 'income' ? 'Pemasukan' : 'Pengeluaran', row.category, row.amount, row.note]),
    ].map((row) => row.map(escapeCsv).join(';')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-keuangan-${month}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!rows) return <Spinner />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Keuangan</h1>
          <p className="text-sm text-slate-500">Catat pemasukan kasir dan pengeluaran operasional toko.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input w-auto font-medium"
          />
          <button className="btn-primary" onClick={() => setForm({ type: 'expense', category: EXPENSE_CATS[0], amount: '', date: todayISO(), note: '' })}>
            <Plus size={16} /> Catat Keuangan
          </button>
        </div>
      </div>

      {/* Tabs: Ringkasan vs Laporan Lanjutan (Mockup 3) */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'overview'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ringkasan Keuangan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`border-b-2 px-4 py-2 text-sm font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'advanced'
              ? 'border-brand-700 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Laporan Lanjutan</span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 border border-brand-200">
            Pro
          </span>
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={TrendingUp} tone="green" label={`Pemasukan (${month})`} value={rupiah(income)} />
            <StatCard icon={TrendingDown} tone="red" label={`Pengeluaran (${month})`} value={rupiah(expense)} />
            <StatCard icon={Scale} tone="brand" label="Laba bersih bulan ini" value={rupiah(income - expense)} />
            <StatCard icon={Wallet} tone="amber" label="Total transaksi" value={monthRows.length} sub={`${monthRows.filter((r) => r.type === 'income').length} masuk, ${monthRows.filter((r) => r.type === 'expense').length} keluar`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <h2 className="mb-4 font-semibold text-slate-900">Tahun {month.slice(0, 4)}</h2>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={yearChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="bulan" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => (v >= 1e6 ? `${v / 1e6}jt` : v >= 1000 ? `${v / 1000}rb` : v)} />
                    <Tooltip formatter={(v) => rupiah(v)} />
                    <Legend />
                    <Bar dataKey="Pemasukan" fill="#047857" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Pengeluaran" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-5">
              <h2 className="mb-4 font-semibold text-slate-900">Pengeluaran per kategori</h2>
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
                <button
                  key={v}
                  onClick={() => setFilter(v)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition ${filter === v ? 'bg-brand-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
                >
                  {l}
                </button>
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
                      <td className="px-4 py-3 font-medium text-slate-800">{r.category}</td>
                      <td className="px-4 py-3 text-slate-500">{r.note || '-'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${r.type === 'income' ? 'text-brand-700' : 'text-red-700'}`}>
                        {r.type === 'income' ? '+' : '-'}{rupiah(r.amount)}
                      </td>
                      <td className="px-2">
                        {!r.transaction_id && <button className="rounded p-1.5 text-red-600 hover:bg-red-50" onClick={() => remove(r)}><Trash2 size={15} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        /* Tab Laporan Lanjutan: Locked Feature Card (Mockup 3) */
        isPro ? (
          <div className="card p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Ringkasan Laporan Keuangan</h3>
                <p className="text-xs text-slate-500">Berdasarkan catatan bulan {month} yang tersimpan di toko.</p>
              </div>
              <button onClick={handleExportExcel} className="btn-primary text-xs font-bold shadow-sm">
                <FileSpreadsheet size={16} /> Unduh CSV untuk Excel
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Total pemasukan</p>
                <p className="mt-1 text-xl font-extrabold text-brand-700">{rupiah(income)}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Dari {monthRows.filter((row) => row.type === 'income').length} catatan</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Total pengeluaran</p>
                <p className="mt-1 text-xl font-extrabold text-red-700">{rupiah(expense)}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Dari {monthRows.filter((row) => row.type === 'expense').length} catatan</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Laba bersih</p>
                <p className={`mt-1 text-xl font-extrabold ${income - expense >= 0 ? 'text-brand-700' : 'text-red-700'}`}>{rupiah(income - expense)}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Pemasukan dikurangi pengeluaran</p>
              </div>
            </div>
          </div>
        ) : (
          <LockedFeatureCard
            title="Laporan keuangan lanjutan"
            desc="Buka ringkasan pemasukan, pengeluaran, laba bersih, dan unduh catatan keuangan untuk Excel dengan Paket Pro."
            requiredPlan="Pro"
            onUpgrade={() => {
              setUpgradeOpen(true)
            }}
          />
        )
      )}

      {/* Modal Catat Keuangan */}
      <Modal open={!!form} onClose={() => setForm(null)} title="Catat Keuangan" size="sm">
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[['expense', 'Pengeluaran'], ['income', 'Pemasukan']].map(([v, l]) => (
                <button
                  type="button" key={v}
                  onClick={() => setForm({ ...form, type: v, category: (v === 'income' ? INCOME_CATS : EXPENSE_CATS)[0] })}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${form.type === v ? (v === 'income' ? 'border-brand-700 bg-brand-50 text-brand-700 ring-1 ring-brand-700' : 'border-red-600 bg-red-50 text-red-700 ring-1 ring-red-600') : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
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

      {/* Upgrade to Pro Modal */}
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        targetPlan="pro"
        onSuccess={async ({ targetPlan, period, method, amount }) => {
          const activated = await upgrade({ targetPlan, period, method, amount })
          if (activated) setActiveTab('advanced')
          return activated
        }}
      />
    </div>
  )
}
