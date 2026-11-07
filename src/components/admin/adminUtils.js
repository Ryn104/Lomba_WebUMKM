/** Helper data untuk halaman-halaman Admin Platform */

export const PLAN_LABEL = { gratis: 'Gratis', bisnis: 'Bisnis', pro: 'Pro' }
export const PLAN_COLOR = { gratis: '#94A3B8', bisnis: '#3B82F6', pro: '#10B981' }

// Harga per bulan — satu sumber dengan useSubscription (src/lib/plans.js)
export { PLAN_PRICE } from '../../lib/plans'

const DAY_MS = 86400000

/** Tanggal (YYYY-MM-DD) menurut zona waktu Jakarta */
export const jakartaDay = (d) =>
  new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })

/**
 * Baca langganan toko dengan aturan yang sama seperti useSubscription:
 * paket berbayar hanya dianggap aktif jika billingMode valid dan belum kedaluwarsa.
 *
 * state: 'free' | 'paid' (dibeli) | 'complimentary' (diberikan admin) | 'expired'
 */
export function getSubscription(store) {
  const raw = store?.theme?.subscription || {}
  const endMs = raw.renewsAt ? new Date(raw.renewsAt).getTime() : null
  const expired = endMs !== null && endMs <= Date.now()
  const isPaidPlan = ['bisnis', 'pro'].includes(raw.plan)
  const hasAccess = ['active', 'complimentary'].includes(raw.billingMode)

  const plan = isPaidPlan && hasAccess && !expired ? raw.plan : 'gratis'
  let state = 'free'
  if (plan !== 'gratis') state = raw.billingMode === 'active' ? 'paid' : 'complimentary'
  else if (isPaidPlan && hasAccess && expired) state = 'expired'

  return {
    plan,
    rawPlan: raw.plan || 'gratis',
    state,
    renewsAt: raw.renewsAt || null,
    daysLeft: plan !== 'gratis' && endMs ? Math.ceil((endMs - Date.now()) / DAY_MS) : null,
    period: raw.period === 'yearly' ? 'yearly' : 'monthly',
    invoices: Array.isArray(raw.invoices) ? raw.invoices : [],
  }
}

export const STATE_LABEL = {
  free: 'Gratis',
  paid: 'Berbayar',
  complimentary: 'Diberikan admin',
  expired: 'Kedaluwarsa',
}

/** Estimasi pendapatan bulanan berulang dari langganan yang benar-benar dibeli */
export function estimateMRR(stores) {
  return stores.reduce((sum, store) => {
    const sub = getSubscription(store)
    if (sub.state !== 'paid') return sum
    return sum + (PLAN_PRICE[sub.plan]?.[sub.period] || 0)
  }, 0)
}

/** Hitung jumlah toko per paket efektif */
export function countByPlan(stores) {
  const result = { gratis: 0, bisnis: 0, pro: 0 }
  stores.forEach((store) => { result[getSubscription(store).plan] += 1 })
  return result
}

/**
 * Status pengguna berdasarkan profil + toko miliknya.
 * tone: success | warning | danger | info | neutral
 */
export function getUserStatus(profile, ownedStores = []) {
  if (profile.role === 'admin') return { key: 'admin', label: 'Admin', tone: 'info' }
  if (ownedStores.length === 0) return { key: 'no-store', label: 'Belum buat toko', tone: 'neutral' }
  if (ownedStores.some((s) => !s.is_active)) return { key: 'suspended', label: 'Toko nonaktif', tone: 'danger' }
  if (ownedStores.some((s) => s.is_published)) return { key: 'live', label: 'Toko live', tone: 'success' }
  return { key: 'draft', label: 'Toko draft', tone: 'warning' }
}

export const USER_STATUS_FILTERS = [
  { value: 'all', label: 'Semua status' },
  { value: 'live', label: 'Toko live' },
  { value: 'draft', label: 'Toko draft' },
  { value: 'suspended', label: 'Toko nonaktif' },
  { value: 'no-store', label: 'Belum buat toko' },
  { value: 'admin', label: 'Admin' },
]

/** Kelompokkan toko berdasarkan pemilik */
export function groupStoresByOwner(stores) {
  const map = new Map()
  stores.forEach((s) => {
    if (!map.has(s.owner_id)) map.set(s.owner_id, [])
    map.get(s.owner_id).push(s)
  })
  return map
}

/**
 * Deret waktu pendaftaran.
 * mode 'day' -> N hari terakhir, mode 'month' -> N bulan terakhir (zona Jakarta).
 * Hasil: [{ key, label, baru, total }] ; total = akumulasi sampai periode tsb.
 */
export function buildSeries(items, getDate, mode, length, getValue = () => 1) {
  const todayKey = jakartaDay(new Date())
  const keys = []
  if (mode === 'month') {
    const [y, m] = todayKey.split('-').map(Number)
    for (let i = length - 1; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(y, m - 1 - i, 1))
      keys.push(d.toISOString().slice(0, 7))
    }
  } else {
    const base = new Date(`${todayKey}T00:00:00Z`)
    for (let i = length - 1; i >= 0; i -= 1) {
      keys.push(new Date(base.getTime() - i * DAY_MS).toISOString().slice(0, 10))
    }
  }

  const sliceLen = mode === 'month' ? 7 : 10
  const counts = new Map(keys.map((k) => [k, 0]))
  let baseline = 0
  items.forEach((item) => {
    const raw = getDate(item)
    if (!raw) return
    const k = jakartaDay(raw).slice(0, sliceLen)
    const v = Number(getValue(item)) || 0
    if (counts.has(k)) counts.set(k, counts.get(k) + v)
    else if (k < keys[0]) baseline += v
  })

  let running = baseline
  return keys.map((key) => {
    const baru = counts.get(key)
    running += baru
    const date = new Date(mode === 'month' ? `${key}-01T00:00:00Z` : `${key}T00:00:00Z`)
    const label = mode === 'month'
      ? date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit', timeZone: 'UTC' })
      : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', timeZone: 'UTC' })
    return { key, label, baru, total: running }
  })
}

/** Pertumbuhan periode ini dibanding periode sebelumnya (panjang sama) */
export function periodGrowth(items, getDate, mode, length) {
  const series = buildSeries(items, getDate, mode, length * 2)
  const previous = series.slice(0, length).reduce((a, b) => a + b.baru, 0)
  const current = series.slice(length).reduce((a, b) => a + b.baru, 0)
  const percent = previous === 0 ? (current > 0 ? null : 0) : Math.round(((current - previous) / previous) * 100)
  return { current, previous, percent, series: series.slice(length) }
}

/** Semua invoice dari seluruh toko (hanya pembelian nyata, bukan paket pemberian admin) */
export function collectPurchases(stores) {
  const rows = []
  stores.forEach((store) => {
    const owner = store.profiles || {}
    getSubscription(store).invoices.forEach((inv) => {
      rows.push({
        id: inv.id,
        date: inv.date,
        description: inv.description || '-',
        plan: /pro/i.test(inv.description || '') ? 'pro' : 'bisnis',
        amount: Number(inv.amount) || 0,
        status: inv.status || '-',
        method: inv.method || '-',
        storeName: store.name,
        storeSlug: store.slug,
        ownerName: owner.full_name || '-',
        ownerEmail: owner.email || '',
      })
    })
  })
  return rows.sort((a, b) => new Date(b.date) - new Date(a.date))
}

/** Pilihan rentang waktu yang dipakai bersama oleh halaman Grafik Pendaftar & Pembelian Paket */
export const RANGE_OPTIONS = [
  { value: '7', label: '7 hari', mode: 'day', length: 7 },
  { value: '30', label: '30 hari', mode: 'day', length: 30 },
  { value: '12m', label: '12 bulan', mode: 'month', length: 12 },
  { value: 'all', label: 'Lifetime' },
]

export function resolveRange(value, items, getDate) {
  const p = RANGE_OPTIONS.find((x) => x.value === value) || RANGE_OPTIONS[1]
  if (p.value !== 'all') return { mode: p.mode, length: p.length, label: p.label, lifetime: false }

  const days = items.map(getDate).filter(Boolean).map((d) => jakartaDay(d)).sort()
  if (!days.length) return { mode: 'day', length: 7, label: p.label, lifetime: true }

  const first = days[0]
  const today = jakartaDay(new Date())
  const spanDays = Math.round((new Date(`${today}T00:00:00Z`) - new Date(`${first}T00:00:00Z`)) / DAY_MS) + 1
  if (spanDays <= 60) return { mode: 'day', length: Math.max(spanDays, 7), label: p.label, lifetime: true }

  const [y1, m1] = first.split('-').map(Number)
  const [y2, m2] = today.split('-').map(Number)
  return { mode: 'month', length: (y2 - y1) * 12 + (m2 - m1) + 1, label: p.label, lifetime: true }
}

/** Ambil item yang tanggalnya berada di dalam rentang deret waktu */
export function filterBySeries(items, getDate, series, mode) {
  if (!series.length) return items
  const startKey = series[0].key
  const len = mode === 'month' ? 7 : 10
  return items.filter((item) => {
    const raw = getDate(item)
    return raw && jakartaDay(raw).slice(0, len) >= startKey
  })
}

/** Unduh array-of-object sebagai CSV (BOM agar Excel membaca UTF-8) */
export function downloadCSV(filename, rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [headers.map(esc).join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\r\n')
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Paginasi sederhana di sisi klien */
export const PAGE_SIZE = 15