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
import { Plus, Trash2, TrendingUp, TrendingDown, Scale, Wallet } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { rupiah, formatDate, todayISO } from '../../lib/utils'
import Modal from '../ui/Modal'
import { Field, StatCard, EmptyState, Spinner } from '../ui/Field'
import MoneyInput from '../ui/MoneyInput'
import { useConfirm } from '../ui/ConfirmModal'  
import { useSubscription } from '../../hooks/useSubscription'
import LockedFeatureCard from '../subscription/LockedFeatureCard'
import UpgradeModal from '../subscription/UpgradeModal'
import AdvancedReport from './finance/AdvancedReport'
import { EXPENSE_CATS, INCOME_CATS } from './finance/financeUtils'

const PIE = ['#047857', '#10b981', '#059669', '#34d399', '#0d9488', '#0284c7', '#f59e0b', '#64748b']

// Format ringkas untuk label di tengah donut: 537.300 -> "Rp 537rb", 5.500.000 -> "Rp 5,5jt"
const compactRupiah = (n) => {
  const trim = (v) => v.toFixed(1).replace(/\.0$/, '').replace('.', ',')
  if (n >= 1e9) return `Rp ${trim(n / 1e9)}M`
  if (n >= 1e6) return `Rp ${trim(n / 1e6)}jt`
  if (n >= 1e3) return `Rp ${Math.round(n / 1e3)}rb`
  return `Rp ${Math.round(n)}`
}

export default function Finance({ store, setStore }) {
  const { plan, isTrial, upgrade } = useSubscription(store, setStore)
  const isPro = plan === 'pro' || isTrial

  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'advanced'
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [rows, setRows] = useState(null)
  const [month, setMonth] = useState(todayISO().slice(0, 7)) // YYYY-MM
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [receiptMap, setReceiptMap] = useState({})
  const [askConfirm, confirmDialog] = useConfirm()

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

    // Fetch invoice_no for transactions
    const txIds = [...new Set((data || []).map(r => r.transaction_id).filter(Boolean))]
    if (txIds.length > 0) {
      const { data: txns } = await supabase
        .from('transactions')
        .select('id,invoice_no')
        .in('id', txIds)
      setReceiptMap(Object.fromEntries(txns?.map(t => [t.id, t.invoice_no]) || []))
    } else {
      setReceiptMap({})
    }
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
    // urut dari yang terbesar agar daftar di bawah donut rapi
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
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
    const ok = await askConfirm({
      title: 'Hapus catatan?',
      message: 'Catatan keuangan ini akan dihapus.',
      confirmLabel: 'Hapus',
      tone: 'danger',
    })
    if (!ok) return
    await supabase.from('finances').delete().eq('id', r.id)
    toast.success('Catatan dihapus')
    load()
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
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="input w-auto font-medium"
          />
          <button className="btn-primary flex-1 justify-center sm:flex-none" onClick={() => setForm({ type: 'expense', category: EXPENSE_CATS[0], amount: '', date: todayISO(), note: '' })}>
            <Plus size={16} /> Catat Keuangan
          </button>
        </div>
      </div>

      {/* Tabs: Ringkasan vs Laporan Lanjutan (Mockup 3) */}
      <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto border-b border-slate-200 px-1">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition ${activeTab === 'overview'
            ? 'border-brand-700 text-brand-700'
            : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
          Ringkasan Keuangan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold transition ${activeTab === 'advanced'
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={TrendingUp} tone="green" label={`Pemasukan (${month})`} value={rupiah(income)} />
            <StatCard icon={TrendingDown} tone="red" label={`Pengeluaran (${month})`} value={rupiah(expense)} />
            <StatCard icon={Scale} tone="brand" label="Laba bersih bulan ini" value={rupiah(income - expense)} />
            <StatCard icon={Wallet} tone="amber" label="Total transaksi" value={monthRows.length} sub={`${monthRows.filter((r) => r.type === 'income').length} masuk, ${monthRows.filter((r) => r.type === 'expense').length} keluar`} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
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

            {/* Donut + daftar persentase, gaya yang sama dengan kartu "Metode pembayaran" di Ringkasan */}
            <div className="card flex flex-col p-5">
              <h2 className="font-semibold text-slate-900">Pengeluaran per kategori</h2>
              <p className="mt-0.5 text-xs text-slate-500">Bagian dari total pengeluaran bulan ini</p>

              {expenseByCat.length === 0 ? (
                <p className="py-16 text-center text-sm text-slate-400">Belum ada pengeluaran.</p>
              ) : (
                <>
                  <div className="relative mt-3 h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseByCat}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="62%"
                          outerRadius="92%"
                          paddingAngle={2}
                          stroke="none"
                        >
                          {expenseByCat.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => rupiah(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Total di tengah donut */}
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                      <p className="text-base font-bold leading-tight text-slate-900">{compactRupiah(expense)}</p>
                      <p className="text-[11px] text-slate-500">Pengeluaran</p>
                    </div>
                  </div>

                  <ul className="hide-scrollbar mt-4 max-h-44 space-y-2.5 overflow-y-auto pr-1">
                    {expenseByCat.map((c, i) => (
                      <li key={c.name} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-slate-800">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PIE[i % PIE.length] }} />
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="shrink-0 text-right leading-tight">
                          <span className="block text-sm font-bold text-slate-900">{expense ? Math.round((c.value / expense) * 100) : 0}%</span>
                          <span className="block text-[11px] text-slate-500">{rupiah(c.value)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
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
              <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Kategori</th>
                    {shown.some(r => r.transaction_id) && <th className="px-4 py-3">Transaksi</th>}
                    <th className="px-4 py-3">Catatan</th>
                    <th className="px-4 py-3 text-right">Jumlah</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shown.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{formatDate(r.date)}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{r.category}</td>
                      {shown.some(row => row.transaction_id) && (
                        <td className="px-4 py-3 text-slate-500">
                          {r.transaction_id ? (receiptMap[r.transaction_id] || '…') : '-'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-slate-500">{r.transaction_id ? '-' : (r.note || '-')}</td>
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
              </div>
            )}
          </div>
        </>
      ) : isPro ? (
        <AdvancedReport store={store} setStore={setStore} />
      ) : (
        <LockedFeatureCard
          title="Laporan keuangan lanjutan"
          desc="Buka laporan laba rugi, produk terlaris, tren penjualan, arus kas, anggaran, dan ekspor CSV dengan Paket Pro."
          requiredPlan="Pro"
          onUpgrade={() => {
            setUpgradeOpen(true)
          }}
        />
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
            <Field label="Jumlah (Rp)"><MoneyInput min="1" required value={form.amount} onChange={(value) => setForm({ ...form, amount: value })} placeholder="Contoh: 500.000" /></Field>
            <Field label="Tanggal"><input type="date" required className="input" value={form.date} onChange={set('date')} /></Field>
            <Field label="Catatan"><input className="input" value={form.note} onChange={set('note')} placeholder="Contoh: Pembelian bahan baku" /></Field>
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
      {confirmDialog}
    </div>
  )
}