/** Utilitas laporan keuangan lanjutan: rentang tanggal, deret waktu, CSV (WIB). */

export const JAKARTA_TZ = 'Asia/Jakarta'
export const DAY_MS = 86400000
export const HOUR_MS = 3600000

export const INCOME_CATS = ['Penjualan Kasir', 'Penjualan Online', 'Lainnya']
export const EXPENSE_CATS = ['Bahan Baku', 'Gaji', 'Sewa', 'Listrik & Air', 'Transportasi', 'Pemasaran', 'Peralatan', 'Lainnya']
export const CHART_COLORS = ['#047857', '#10b981', '#059669', '#34d399', '#0d9488', '#0284c7', '#f59e0b', '#64748b']
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** Tanggal Jakarta dalam format YYYY-MM-DD. */
export const jakartaDate = (value) => new Date(value).toLocaleDateString('en-CA', { timeZone: JAKARTA_TZ })

/** Tanggal + jam Jakarta untuk ekspor dan label. */
export const jakartaDateTime = (value) =>
  new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))

/** Jam (0–23) menurut zona Jakarta. */
export const jakartaHour = (value) =>
  Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: JAKARTA_TZ }).format(new Date(value)))

export const jakartaWeekday = (value) =>
  new Date(value).toLocaleDateString('id-ID', { weekday: 'long', timeZone: JAKARTA_TZ })

/** Rentang satu bulan kalender (start inklusif, end eksklusif) memakai batas tengah malam Jakarta. */
export const monthRange = (month) => {
  const [year, monthIndex] = month.split('-').map(Number)
  const start = new Date(Date.UTC(year, monthIndex - 1, 1) - 7 * HOUR_MS)
  const end = new Date(Date.UTC(year, monthIndex, 1) - 7 * HOUR_MS)
  return { start, end }
}

/** Rentang tanggal kustom; `to` ikut dihitung (inklusif). */
export const customRange = (from, to) => {
  const start = new Date(`${from}T00:00:00+07:00`)
  const end = new Date(`${to}T00:00:00+07:00`)
  return { start, end: new Date(end.getTime() + DAY_MS) }
}

export const formatShortDate = (dateKey) =>
  new Date(`${dateKey}T00:00:00Z`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', timeZone: 'UTC' })

export const formatPeriodLabel = (start, end) =>
  `${formatShortDate(jakartaDate(start))} – ${formatShortDate(jakartaDate(new Date(end.getTime() - 1)))}`

const weekKey = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7))
  return date.toISOString().slice(0, 10)
}

const seriesKey = (dateKey, granularity) => {
  if (granularity === 'month') return dateKey.slice(0, 7)
  if (granularity === 'week') return weekKey(dateKey)
  return dateKey
}

const seriesLabel = (key, granularity) => {
  if (granularity === 'month') {
    return new Date(`${key}-01T00:00:00Z`).toLocaleDateString('id-ID', { month: 'short', year: '2-digit', timeZone: 'UTC' })
  }
  return formatShortDate(key)
}

/** Seri omzet & jumlah transaksi per hari/minggu/bulan. */
export const buildSalesSeries = (transactions = [], granularity = 'day') => {
  const map = new Map()
  transactions.forEach((transaction) => {
    const key = seriesKey(jakartaDate(transaction.created_at), granularity)
    const row = map.get(key) || { key, omzet: 0, transaksi: 0 }
    row.omzet += Number(transaction.total) || 0
    row.transaksi += 1
    map.set(key, row)
  })
  return [...map.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((row) => ({ ...row, label: seriesLabel(row.key, granularity) }))
}

/** Arus kas kumulatif dari catatan finances (pemasukan vs pengeluaran). */
export const buildCashFlow = (finances = [], granularity = 'day') => {
  const map = new Map()
  finances.forEach((row) => {
    const key = seriesKey(row.date, granularity)
    const current = map.get(key) || { key, masuk: 0, keluar: 0 }
    if (row.type === 'income') current.masuk += Number(row.amount) || 0
    else current.keluar += Number(row.amount) || 0
    map.set(key, current)
  })

  let runningIn = 0
  let runningOut = 0
  return [...map.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((row) => {
      runningIn += row.masuk
      runningOut += row.keluar
      return {
        key: row.key,
        label: seriesLabel(row.key, granularity),
        Pemasukan: runningIn,
        Pengeluaran: runningOut,
        Saldo: runningIn - runningOut,
      }
    })
}

/** Persentase perubahan; null berarti belum ada pembanding (periode sebelumnya nol). */
export const pctChange = (current, previous) => {
  if (!previous) return current ? null : 0
  return ((current - previous) / previous) * 100
}

/** CSV dengan BOM UTF-8 agar Excel membaca huruf beraksen dengan benar. Angka dikirim mentah. */
export const downloadCsv = (filename, rows = []) => {
  if (!rows.length) return false
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = rows.map((row) => row.map(escape).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return true
}
