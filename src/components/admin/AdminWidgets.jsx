import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import UserAvatar from '../ui/Avatar'
import { PLAN_COLOR, PLAN_LABEL, STATE_LABEL } from './adminUtils'

const TONES = {
  success: 'bg-[#DCFCE7] text-[#166534]',
  warning: 'bg-[#FEF3C7] text-[#92400E]',
  danger: 'bg-[#FEE2E2] text-[#991B1B]',
  info: 'bg-[#DBEAFE] text-[#1D4ED8]',
  neutral: 'bg-[#F1F5F9] text-[#334155]',
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${TONES[tone] || TONES.neutral}`}>{children}</span>
}

export function PlanBadge({ plan }) {
  const tone = plan === 'pro' ? 'success' : plan === 'bisnis' ? 'info' : 'neutral'
  return <Badge tone={tone}>{PLAN_LABEL[plan] || 'Gratis'}</Badge>
}

export function StateBadge({ state }) {
  const tone = state === 'paid' ? 'success' : state === 'complimentary' ? 'info' : state === 'expired' ? 'danger' : 'neutral'
  return <Badge tone={tone}>{STATE_LABEL[state] || '-'}</Badge>
}

export function PageHeader({ title, desc, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {desc && <p className="text-sm text-slate-500">{desc}</p>}
      </div>
      {actions}
    </div>
  )
}

export function ChartCard({ title, desc, children, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {desc && <p className="text-xs text-slate-500">{desc}</p>}
      <div className="mt-4 h-64">{children}</div>
    </div>
  )
}

/** Donut distribusi paket Gratis / Bisnis / Pro */
export function PlanDonut({ counts }) {
  const data = ['gratis', 'bisnis', 'pro'].map((k) => ({ key: k, name: PLAN_LABEL[k], value: counts[k] || 0 }))
  const total = data.reduce((a, b) => a + b.value, 0)
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        {total === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-slate-400">Belum ada data</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="90%" paddingAngle={2} stroke="none">
                {data.map((d) => <Cell key={d.key} fill={PLAN_COLOR[d.key]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-600">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PLAN_COLOR[d.key] }} />
            {d.name}: <b className="text-slate-900">{d.value}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Tab pilihan (rentang waktu / filter) */
export function Tabs({ value, onChange, options }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${value === o.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          {o.label}{o.count !== undefined && <span className="ml-1 text-slate-400">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Pagination({ page, pageCount, total, pageSize, onChange }) {
  if (pageCount <= 1) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
      <span>{from}–{to} dari {total}</span>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Halaman sebelumnya" className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
        <span className="px-2 font-medium text-slate-700">{page} / {pageCount}</span>
        <button type="button" disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Halaman berikutnya" className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={16} /></button>
      </div>
    </div>
  )
}

export function Avatar({ profile }) {
  const name = profile?.full_name || profile?.email || '?'
  return <UserAvatar name={name} src={profile?.avatar_url || ''} variant="soft" className="h-9 w-9 text-sm" />
}