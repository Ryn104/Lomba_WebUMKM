import { useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Users, UserPlus, Store, Percent } from 'lucide-react'
import { StatCard } from '../ui/Field'
import { ChartCard, PageHeader, Tabs } from './AdminWidgets'
import { RANGE_OPTIONS, buildSeries, periodGrowth, resolveRange } from './adminUtils'

const growthText = (g) => {
  if (g.lifetime) return 'Sejak awal platform'
  return g.percent === null ? 'Baru mulai tumbuh' : `${g.percent >= 0 ? '+' : ''}${g.percent}% vs periode sebelumnya`
}

export default function AdminGrowth({ users, stores }) {
  const [range, setRange] = useState('30')

  const data = useMemo(() => {
    const cfg = resolveRange(range, users, (u) => u.created_at)
    const cumulative = buildSeries(users, (u) => u.created_at, cfg.mode, cfg.length)

    let userGrowth
    let storeGrowth
    if (cfg.lifetime) {
      userGrowth = { current: users.length, percent: null, series: cumulative, lifetime: true }
      storeGrowth = { current: stores.length, percent: null, lifetime: true }
    } else {
      userGrowth = periodGrowth(users, (u) => u.created_at, cfg.mode, cfg.length)
      storeGrowth = periodGrowth(stores, (s) => s.created_at, cfg.mode, cfg.length)
    }

    const owners = new Set(stores.map((s) => s.owner_id))
    const nonAdmin = users.filter((u) => u.role !== 'admin')
    const conversion = nonAdmin.length ? Math.round((nonAdmin.filter((u) => owners.has(u.id)).length / nonAdmin.length) * 100) : 0
    return { cfg, userGrowth, storeGrowth, cumulative, conversion }
  }, [users, stores, range])

  const { mode, length, label, lifetime } = data.cfg
  const xInterval = length > 30 ? Math.floor(length / 8) : 'preserveStartEnd'
  const per = mode === 'month' ? 'bulan' : 'hari'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grafik Pendaftar"
        desc="Perkembangan jumlah pengguna di platform."
        actions={<Tabs value={range} onChange={setRange} options={RANGE_OPTIONS.map(({ value, label: text }) => ({ value, label: text }))} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UserPlus} tone="info" label={lifetime ? 'Total pendaftar (lifetime)' : `Pendaftar baru (${label})`} value={data.userGrowth.current} sub={growthText(data.userGrowth)} />
        <StatCard icon={Users} label="Total pengguna" value={users.length} />
        <StatCard icon={Store} tone="green" label={lifetime ? 'Total toko (lifetime)' : `Toko baru (${label})`} value={data.storeGrowth.current} sub={growthText(data.storeGrowth)} />
        <StatCard icon={Percent} tone="amber" label="Konversi punya toko" value={`${data.conversion}%`} sub="Pengguna yang sudah membuat toko" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Pendaftar baru" desc={`Akun baru per ${per}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.userGrowth.series}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={xInterval} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
              <Tooltip />
              <Bar dataKey="baru" name="Pendaftar baru" fill="#047857" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Total pengguna" desc="Akumulasi seluruh akun terdaftar">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.cumulative}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={xInterval} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
              <Tooltip />
              <Area type="monotone" dataKey="total" name="Total pengguna" stroke="#047857" fill="#A7F3D0" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}