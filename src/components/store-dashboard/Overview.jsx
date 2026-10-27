import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Package, TrendingUp, TrendingDown, ShoppingCart, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { rupiah, formatDateTime } from '../../lib/utils'
import { StatCard, Spinner } from '../ui/Field'

export default function Overview({ store }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    ;(async () => {
      const since = new Date()
      since.setDate(since.getDate() - 6)
      const sinceISO = since.toISOString().slice(0, 10)
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

      const [prod, fin, tx] = await Promise.all([
        supabase.from('products').select('id,name,stock').eq('store_id', store.id),
        supabase.from('finances').select('type,amount,date').eq('store_id', store.id).gte('date', monthStart < sinceISO ? monthStart : sinceISO),
        supabase.from('transactions').select('id,invoice_no,total,created_at').eq('store_id', store.id).order('created_at', { ascending: false }).limit(5),
      ])
      setData({ products: prod.data || [], finances: fin.data || [], recent: tx.data || [], monthStart, sinceISO })
    })()
  }, [store.id])

  if (!data) return <Spinner />

  const { products, finances, recent, monthStart } = data
  const month = finances.filter((f) => f.date >= monthStart)
  const income = month.filter((f) => f.type === 'income').reduce((a, b) => a + Number(b.amount), 0)
  const expense = month.filter((f) => f.type === 'expense').reduce((a, b) => a + Number(b.amount), 0)
  const lowStock = products.filter((p) => p.stock <= 5)

  // grafik 7 hari terakhir
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
  const chart = days.map((d) => ({
    hari: new Date(d).toLocaleDateString('id-ID', { weekday: 'short' }),
    Pemasukan: finances.filter((f) => f.date === d && f.type === 'income').reduce((a, b) => a + Number(b.amount), 0),
    Pengeluaran: finances.filter((f) => f.date === d && f.type === 'expense').reduce((a, b) => a + Number(b.amount), 0),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Halo, selamat datang 👋</h1>
        <p className="text-sm text-slate-500">Ringkasan toko {store.name} bulan ini.</p>
      </div>

      {!store.is_published && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-[#FEF3C7] p-4">
          <p className="text-sm text-[#92400E]">Website toko Anda masih <b>draft</b>. Desain lalu publikasikan agar bisa diakses pelanggan.</p>
          <Link to="/builder" className="btn-primary">Buka Web Builder</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={TrendingUp} tone="green" label="Pemasukan bulan ini" value={rupiah(income)} />
        <StatCard icon={TrendingDown} tone="red" label="Pengeluaran bulan ini" value={rupiah(expense)} />
        <StatCard icon={ShoppingCart} tone="brand" label="Laba bersih" value={rupiah(income - expense)} />
        <StatCard icon={Package} tone="amber" label="Total produk" value={products.length} sub={`${lowStock.length} stok menipis`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <h2 className="mb-4 font-semibold text-slate-900">Arus kas 7 hari terakhir</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hari" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}rb` : v)} />
                <Tooltip formatter={(v) => rupiah(v)} />
                <Bar dataKey="Pemasukan" fill="#047857" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-slate-900">Transaksi kasir terbaru</h2>
            {recent.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada transaksi.</p>
            ) : (
              <ul className="divide-y divide-slate-100 text-sm">
                {recent.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2 text-slate-800">
                    <div>
                      <p className="font-medium text-slate-900">{t.invoice_no}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(t.created_at)}</p>
                    </div>
                    <b>{rupiah(t.total)}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lowStock.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><AlertTriangle size={16} className="text-amber-600" /> Stok menipis</h2>
              <ul className="space-y-1 text-sm">
                {lowStock.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex justify-between text-slate-800"><span>{p.name}</span><b className={p.stock === 0 ? 'text-red-700' : 'text-amber-800'}>{p.stock}</b></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
