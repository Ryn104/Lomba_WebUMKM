import { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { rupiah } from '../../../lib/utils'
import { buildCashFlow } from './financeUtils'

/** Arus kas kumulatif pemasukan vs pengeluaran beserta saldo bersih. */
export default function CashFlow({ report }) {
  const granularity = report.spanDays > 62 ? 'month' : 'day'
  const series = useMemo(() => buildCashFlow(report.finances, granularity), [report.finances, granularity])
  const totalIn = report.finances.filter((row) => row.type === 'income').reduce((total, row) => total + (Number(row.amount) || 0), 0)
  const totalOut = report.finances.filter((row) => row.type === 'expense').reduce((total, row) => total + (Number(row.amount) || 0), 0)

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Arus Kas</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Pemasukan dan pengeluaran kumulatif dari catatan keuangan (termasuk penjualan kasir).
          </p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {granularity === 'month' ? 'Akumulasi per bulan' : 'Akumulasi per hari'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-medium text-slate-500">Total pemasukan</p>
          <p className="mt-1 text-lg font-extrabold text-brand-700">{rupiah(totalIn)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-medium text-slate-500">Total pengeluaran</p>
          <p className="mt-1 text-lg font-extrabold text-red-700">{rupiah(totalOut)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-medium text-slate-500">Saldo bersih</p>
          <p className={`mt-1 text-lg font-extrabold ${totalIn - totalOut >= 0 ? 'text-brand-700' : 'text-red-700'}`}>
            {rupiah(totalIn - totalOut)}
          </p>
        </div>
      </div>

      <div className="mt-5 h-64">
        {series.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-400">Belum ada data untuk periode ini.</p>
        ) : (
          <ResponsiveContainer>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(value) => (value >= 1e6 ? `${value / 1e6}jt` : value >= 1000 ? `${value / 1000}rb` : value)} />
              <Tooltip formatter={(value) => rupiah(value)} />
              <Legend />
              <Line type="monotone" dataKey="Pemasukan" stroke="#047857" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Saldo" stroke="#0f172a" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}
