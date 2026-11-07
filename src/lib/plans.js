/** Satu sumber kebenaran untuk paket langganan: harga, batas kuota, dan daftar fitur. */
export const PLAN_ORDER = ['gratis', 'bisnis', 'pro']

export const YEARLY_SAVING_LABEL = 'Hemat 20%'

// Batas section paket Gratis disamakan dengan penegakan di Web Builder (4 section).
export const PLANS = {
  gratis: {
    id: 'gratis',
    name: 'Gratis',
    tagline: 'Untuk UMKM yang baru mulai berjualan online',
    price: { monthly: 0, yearly: 0 },
    features: ['10 produk', '4 section website', 'Watermark platform', '500 MB media'],
    limits: {
      maxProducts: 10,
      maxSections: 4,
      hasWatermark: true,
      hasCustomDomain: false,
      hasAdvancedFinance: false,
      maxImagesGB: 0.5,
      maxPosMonthly: 50,
    },
  },
  bisnis: {
    id: 'bisnis',
    name: 'Bisnis',
    tagline: 'Untuk toko yang siap tampil profesional',
    price: { monthly: 79000, yearly: 63000 },
    features: [
      'Produk & section tanpa batas',
      'Tanpa watermark',
      'Penyimpanan media 5 GB',
      '500 transaksi POS/bulan',
    ],
    limits: {
      maxProducts: Infinity,
      maxSections: Infinity,
      hasWatermark: false,
      hasCustomDomain: true,
      hasAdvancedFinance: false,
      maxImagesGB: 5,
      maxPosMonthly: 500,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    badge: 'Paling Lengkap',
    tagline: 'Untuk bisnis yang butuh laporan keuangan lengkap',
    price: { monthly: 149000, yearly: 119000 },
    features: [
      'Semua fitur paket Bisnis',
      'Advanced Finance',
      'Ekspor laporan keuangan CSV',
      'Penyimpanan media 20 GB',
      'Transaksi POS tanpa batas',
    ],
    limits: {
      maxProducts: Infinity,
      maxSections: Infinity,
      hasWatermark: false,
      hasCustomDomain: true,
      hasAdvancedFinance: true,
      maxImagesGB: 20,
      maxPosMonthly: Infinity,
    },
  },
}

/** Harga bulanan/tahunan (tahunan = harga per bulan bila dibayar setahun). */
export const PLAN_PRICE = {
  bisnis: PLANS.bisnis.price,
  pro: PLANS.pro.price,
}

export const isPaidPlan = (plan) => plan === 'bisnis' || plan === 'pro'

export const planOf = (plan = 'gratis') => PLANS[plan] || PLANS.gratis

export const planLimits = (plan = 'gratis') => planOf(plan).limits

export const planPrice = (plan = 'gratis', period = 'monthly') =>
  planOf(plan).price[period === 'yearly' ? 'yearly' : 'monthly']

/** Total tagihan satu periode (tahunan = 12 x harga per bulan). */
export const planTotal = (plan = 'gratis', period = 'monthly') =>
  period === 'yearly' ? planPrice(plan, 'yearly') * 12 : planPrice(plan, 'monthly')
