import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { rupiah } from '../../../lib/utils'

const Growth = ({ value }) => {
  if (value === null) return <span className="text-[11px] font-medium text-slate-400">belum ada pembanding</span>
  if (Math.abs(value) < 0.5) {
    return <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-slate-500"><Minus size={11} /> stabil</span>
  }
  const up = value > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-emerald-700' : 'text-red-700'}`}>
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(value).toFixed(1)}% vs periode sebelumnya
    </span>
  )
}

const Row = ({ label, value, previous, tone = 'default', strong = false, percent }) => {
  const tones = {
    default: 'text-slate-900',
    green: 'text-brand-700',
    red: 'text-red-700',
  }
  return (
    <div className={`flex flex-wrap items-baseline justify-between gap-1 border-b border-slate-100 py-2.5 last:border-0 ${strong ? 'font-bold' : ''}`}>
      <span className="text-sm text-slate-600">{label}</span>
      <span className="flex flex-wrap items-baseline justify-end gap-2 text-right">
        {percent !== undefined && <span className="text-[11px] text-slate-400">{percent.toFixed(1)}%</span>}
        <span className={`text-sm font-semibold ${tones[tone]}`}>{rupiah(value)}</span>
        {previous !== undefined && <span className="w-full text-[11px] text-slate-400 sm:w-auto">sebelumnya {rupiah(previous)}</span>}
      </span>
    </div>
  )
}

/** Laporan laba rugi: pendapatan, HPP, laba kotor, pengeluaran per kategori, laba bersih. */
export default function ProfitLoss({ report }) {
  const grossMargin = report.revenue ? (report.gross / report.revenue) * 100 : 0
  const netMargin = report.revenue ? (report.net / report.revenue) * 100 : 0

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Laporan Laba Rugi</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Pendapatan penjualan, HPP dari harga modal, dan pengeluaran operasional.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600">
            Margin kotor {grossMargin.toFixed(1)}%
          </span>
          <span className={`rounded-full border px-2.5 py-1 font-semibold ${report.net >= 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'}`}>
            Margin bersih {netMargin.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="mt-2">
        <Row label="Pendapatan penjualan" value={report.revenue} previous={report.previousRevenue} tone="green" />
        <Row label="Harga Pokok Penjualan (HPP)" value={report.hpp} previous={report.previousHpp} tone="red" />
        <Row label="Laba kotor" value={report.gross} previous={report.previousGross} strong percent={grossMargin} />
        <Row label="Total pengeluaran operasional" value={report.opex} previous={report.previousOpex} tone="red" />
        <Row label="Laba bersih" value={report.net} previous={report.previousNet} tone={report.net >= 0 ? 'green' : 'red'} strong percent={netMargin} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">Perubahan pendapatan:</span>
        <Growth value={report.revenueGrowth} />
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-semibold text-slate-800">Pengeluaran per kategori</h4>
        {report.expenseByCategory.length === 0 ? (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
            Belum ada pengeluaran operasional pada periode ini.
          </p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Kategori</th>
                  <th className="px-3 py-2 text-right">Jumlah</th>
                  <th className="px-3 py-2 text-right">Porsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.expenseByCategory.map((row) => (
                  <tr key={row.category}>
                    <td className="px-3 py-2 text-slate-700">{row.category}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">{rupiah(row.amount)}</td>
                    <td className="px-3 py-2 text-right text-xs text-slate-500">{row.share.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
