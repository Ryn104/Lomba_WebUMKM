import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { Clock3, CalendarDays, ReceiptText } from 'lucide-react'
import { rupiah } from '../../../lib/utils'
import { buildSalesSeries, pctChange } from './financeUtils'

const GRANULARITY = [
  { id: 'day', label: 'Harian' },
  { id: 'week', label: 'Mingguan' },
  { id: 'month', label: 'Bulanan' },
]

const Metric = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <Icon size={15} className="text-slate-400" />
    </div>
    <p className="mt-1 text-lg font-extrabold text-slate-900">{value}</p>
    {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
  </div>
)

/** Tren penjualan + jam/hari tersibuk + rata-rata nilai transaksi (AOV). */
export default function SalesTrend({ report }) {
  const [granularity, setGranularity] = useState('day')
  const series = useMemo(() => buildSalesSeries(report.transactions, granularity), [report.transactions, granularity])
  const aovGrowth = pctChange(report.aov, report.previousAov)

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Tren & Analitik Penjualan</h3>
          <p className="mt-0.5 text-xs text-slate-500">Omzet dan jumlah transaksi per periode.</p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {GRANULARITY.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={granularity === option.id}
              onClick={() => setGranularity(option.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${granularity === option.id ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric
          icon={ReceiptText}
          label="Rata-rata nilai transaksi"
          value={rupiah(report.aov)}
          sub={aovGrowth === null ? `${report.txCount} transaksi` : `${aovGrowth >= 0 ? '▲' : '▼'} ${Math.abs(aovGrowth).toFixed(1)}% vs periode sebelumnya`}
        />
        <Metric
          icon={Clock3}
          label="Jam tersibuk"
          value={report.busiestHour ? `${report.busiestHour.jam}:00` : '—'}
          sub={report.busiestHour ? `${report.busiestHour.transaksi} transaksi` : 'Belum ada transaksi'}
        />
        <Metric
          icon={CalendarDays}
          label="Hari tersibuk"
          value={report.busiestDay?.label || '—'}
          sub={report.busiestDay ? `${report.busiestDay.count} transaksi` : 'Belum ada transaksi'}
        />
      </div>

      <div className="mt-5 h-64">
        {series.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-400">Belum ada data untuk periode ini.</p>
        ) : (
          <ResponsiveContainer>
            <ComposedChart data={series}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis
                yAxisId="omzet"
                fontSize={11}
                tickFormatter={(value) => (value >= 1e6 ? `${value / 1e6}jt` : value >= 1000 ? `${value / 1000}rb` : value)}
              />
              <YAxis yAxisId="trx" orientation="right" fontSize={11} allowDecimals={false} />
              <Tooltip formatter={(value, name) => (name === 'Omzet' ? rupiah(value) : `${value} transaksi`)} />
              <Legend />
              <Bar yAxisId="omzet" dataKey="omzet" name="Omzet" fill="#047857" radius={[4, 4, 0, 0]} />
              <Line yAxisId="trx" type="monotone" dataKey="transaksi" name="Transaksi" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-6">
        <p className="text-xs font-bold text-slate-700">Transaksi per jam (WIB)</p>
        <div className="mt-2 h-32">
          <ResponsiveContainer>
            <ComposedChart data={report.hourly}>
              <XAxis dataKey="jam" fontSize={10} interval={2} />
              <Tooltip formatter={(value) => `${value} transaksi`} labelFormatter={(label) => `Jam ${label}:00`} />
              <Bar dataKey="transaksi" fill="#34d399" radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
