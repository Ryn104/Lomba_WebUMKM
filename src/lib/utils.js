/** Format digits for a money input without currency prefix; empty stays empty. */
export const normalizeMoneyDigits = (value) => String(value ?? '').replace(/\D/g, '')
export const formatMoneyInput = (value) => {
  const digits = normalizeMoneyDigits(value)
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
}

export const rupiah = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n) || 0)

export const formatDate = (d) =>
  d
    ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d))
    : '-'

export const formatDateTime = (d) =>
  d
    ? new Intl.DateTimeFormat('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }).format(new Date(d))
    : '-'

export const slugify = (s = '') =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Slug yang tidak boleh dipakai toko karena bentrok dengan route platform */
export const RESERVED_SLUGS = [
  'login', 'register', 'admin', 'dashboard', 'builder', 'pos', 'toko', 'api', 'assets', 'app',
]

export const cn = (...c) => c.filter(Boolean).join(' ')

export const todayISO = () => new Date().toISOString().slice(0, 10)

/** Strip non-digits and limit to 13 characters. */
export const sanitizePhone = (value) => (value || '').replace(/\D/g, '').slice(0, 13)

/** Hitung harga setelah diskon. discounts = diskon aktif milik toko */
export function getDiscountedPrice(product, discounts = []) {
  const today = todayISO()
  const applicable = discounts.filter(
    (d) =>
      d.is_active &&
      (!d.product_id || d.product_id === product.id) &&
      (!d.start_date || d.start_date <= today) &&
      (!d.end_date || d.end_date >= today)
  )
  let best = 0
  let bestDiscount = null
  for (const d of applicable) {
    const amount = d.type === 'percent' ? (product.price * d.value) / 100 : Number(d.value)
    if (amount > best) {
      best = amount
      bestDiscount = d
    }
  }
  best = Math.min(best, product.price)
  return { final: product.price - best, amount: best, discount: bestDiscount }
}
