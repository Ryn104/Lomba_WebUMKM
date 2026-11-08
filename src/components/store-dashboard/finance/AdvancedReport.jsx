import { useMemo, useState } from 'react'
import { AlertTriangle, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { EmptyState } from '../../ui/Field'
import { rupiah, todayISO } from '../../../lib/utils'
import { customRange, formatPeriodLabel, monthRange } from './financeUtils'
import { useFinanceReport } from './useFinanceReport'
import ProfitLoss from './ProfitLoss'
import TopProducts from './TopProducts'
import SalesTrend from './SalesTrend'
import CashFlow from './CashFlow'
import Budget from './Budget'
import ExportButton from './ExportButton'

const SkeletonCard = ({ lines = 3 }) => (
  <div className="card animate-pulse p-5 sm:p-6">
    <div className="h-4 w-40 rounded bg-slate-200" />
    <div className="mt-4 space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-3 w-full rounded bg-slate-100" />
      ))}
    </div>
  </div>
)

const INSIGHT_STYLES = {
  up: { icon: TrendingUp, className: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  down: { icon: TrendingDown, className: 'border-red-200 bg-red-50 text-red-700' },
  warn: { icon: AlertTriangle, className: 'border-amber-200 bg-amber-50 text-amber-800' },
  info: { icon: Wallet, className: 'border-slate-200 bg-slate-50 text-slate-700' },
}

export default function AdvancedReport({ store, setStore }) {
  const [mode, setMode] = useState('month')
  const [month, setMonth] = useState(todayISO().slice(0, 7))
  const [from, setFrom] = useState(`${todayISO().slice(0, 7)}-01`)
  const [to, setTo] = useState(todayISO())

  const range = useMemo(() => {
    if (mode === 'month') return monthRange(month)
    const startKey = from || `${todayISO().slice(0, 7)}-01`
    const endKey = to || todayISO()
    return startKey <= endKey ? customRange(startKey, endKey) : customRange(endKey, startKey)
  }, [mode, month, from, to])

  const { loading, error, report } = useFinanceReport(store.id, range.start, range.end)
  const periodLabel = formatPeriodLabel(range.start, range.end)

  const insights = useMemo(() => {
    if (!report) return []
    const list = []
    if (report.previousRevenue > 0) {
      const growth = report.revenueGrowth
      list.push({
        tone: growth >= 0 ? 'up' : 'down',
        text: `Penjualan ${growth >= 0 ? 'naik' : 'turun'} ${Math.abs(growth).toFixed(1)}% dari periode sebelumnya (${rupiah(report.previousRevenue)}).`,
      })
    } else if (report.revenue > 0) {
      list.push({ tone: 'info', text: `Belum ada penjualan pembanding. Pendapatan periode ini ${rupiah(report.revenue)}.` })
    }
    if (report.missingCostCount > 0) {
      list.push({
        tone: 'warn',
        text: `${report.missingCostCount} produk terlaris belum punya harga modal, sehingga laba bisa lebih kecil dari yang tampil.`,
      })
    }
    if (report.lowMarginCount > 0) {
      list.push({
        tone: 'warn',
        text: `${report.lowMarginCount} produk memiliki margin di bawah 15%. Pertimbangkan menaikkan harga atau menekan HPP.`,
      })
    }
    if (report.net < 0) {
      list.push({ tone: 'down', text: `Laba bersih negatif ${rupiah(report.net)} pada periode ini.` })
    } else if (report.opex > 0 && report.opex > report.gross) {
      list.push({ tone: 'warn', text: 'Pengeluaran operasional lebih besar dari laba kotor periode ini.' })
    } else if (report.revenue > 0) {
      list.push({
        tone: 'up',
        text: `Laba bersih ${rupiah(report.net)} atau ${((report.net / report.revenue) * 100).toFixed(1)}% dari pendapatan.`,
      })
    }
    return list
  }, [report])

  const hasData = Boolean(report) && (report.txCount > 0 || report.finances.length > 0)

  return (
    <div className="space-y-6">
      <div className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Periode laporan</h3>
            <p className="mt-0.5 text-xs text-slate-500">{periodLabel} · zona waktu Asia/Jakarta</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              {[
                { id: 'month', label: 'Bulan' },
                { id: 'custom', label: 'Rentang tanggal' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={mode === option.id}
                  onClick={() => setMode(option.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${mode === option.id ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {mode === 'month' ? (
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="input w-auto py-1.5 text-xs" />
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                <input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} className="input w-auto py-1.5 text-xs" />
                <span className="text-xs text-slate-400">–</span>
                <input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} className="input w-auto py-1.5 text-xs" />
              </div>
            )}

            {report && hasData && (
              <ExportButton report={report} periodLabel={periodLabel} storeName={store.name} periodKey={month} />
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-6">
          <SkeletonCard lines={5} />
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
          <SkeletonCard lines={6} />
        </div>
      )}

      {!loading && error && (
        <div className="card border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Laporan tidak dapat dimuat: {error.message}
        </div>
      )}

      {!loading && !error && report && !hasData && (
        <div className="card">
          <EmptyState
            icon={Wallet}
            title="Belum ada data untuk periode ini"
            desc="Catat transaksi kasir atau pengeluaran operasional, lalu kembali ke laporan ini."
          />
        </div>
      )}

      {!loading && !error && report && hasData && (
        <>
          {insights.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {insights.map((insight, index) => {
                const style = INSIGHT_STYLES[insight.tone] || INSIGHT_STYLES.info
                const Icon = style.icon
                return (
                  <div key={index} className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${style.className}`}>
                    <Icon size={15} className="mt-0.5 shrink-0" />
                    <span>{insight.text}</span>
                  </div>
                )
              })}
            </div>
          )}

          <ProfitLoss report={report} />
          <TopProducts report={report} />
          <SalesTrend report={report} />
          <CashFlow report={report} />
          <Budget store={store} setStore={setStore} />
        </>
      )}
    </div>
  )
}
