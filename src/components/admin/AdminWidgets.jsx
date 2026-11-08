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
  if (state === 'free') return null
  const tone = state === 'paid' ? 'success' : state === 'complimentary' ? 'info' : state === 'expired' ? 'danger' : 'neutral'
  return <Badge tone={tone}>{STATE_LABEL[state] || '-'}</Badge>
}

/** Judul halaman: eyebrow hijau kecil + judul tebal, gaya yang sama dengan section di landing page */
export function PageHeader({ eyebrow = 'Admin', title, desc, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-sm font-semibold text-brand-600">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      </div>
      {actions}
    </div>
  )
}

export function ChartCard({ title, desc, children, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-brand-500" />
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      {desc && <p className="mt-0.5 pl-4 text-xs text-slate-500">{desc}</p>}
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

/** Tab pilihan berbentuk pill (rentang waktu / filter); tab aktif berwarna hijau brand */
export function Tabs({ value, onChange, options }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-slate-500/20 bg-slate-500/10 p-1">
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
              active ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-500/10 hover:text-slate-800'
            }`}
          >
            {o.label}
            {o.count !== undefined && <span className={`ml-1 ${active ? 'text-white/70' : 'text-slate-400'}`}>{o.count}</span>}
          </button>
        )
      })}
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
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Halaman sebelumnya" className="rounded-full p-1.5 transition hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
        <span className="rounded-full bg-slate-500/10 px-3 py-1 font-medium text-slate-700">{page} / {pageCount}</span>
        <button type="button" disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Halaman berikutnya" className="rounded-full p-1.5 transition hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={16} /></button>
      </div>
    </div>
  )
}

export function Avatar({ profile }) {
  const name = profile?.full_name || profile?.email || '?'
  return <UserAvatar name={name} src={profile?.avatar_url || ''} variant="soft" className="h-9 w-9 text-sm" />
}