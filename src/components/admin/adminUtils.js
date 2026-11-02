/** Helper data untuk halaman-halaman Admin Platform */

export const PLAN_LABEL = { gratis: 'Gratis', bisnis: 'Bisnis', pro: 'Pro' }
export const PLAN_COLOR = { gratis: '#94A3B8', bisnis: '#3B82F6', pro: '#10B981' }

// Harga per bulan (sama dengan useSubscription.js)
export const PLAN_PRICE = {
  bisnis: { monthly: 79000, yearly: 63000 },
  pro: { monthly: 149000, yearly: 119000 },
}

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
export function buildSeries(items, getDate, mode, length) {
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
    if (counts.has(k)) counts.set(k, counts.get(k) + 1)
    else if (k < keys[0]) baseline += 1
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