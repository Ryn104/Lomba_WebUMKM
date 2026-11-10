export const PLAN_ORDER = ['basic', 'bisnis', 'pro']

export const YEARLY_SAVING_LABEL = 'Hemat 20%'
export const TRIAL_DURATION_DAYS = 30

export const PLAN_TIER = {
  basic: 1,
  bisnis: 2,
  pro: 3,
}

export const planTierOf = (plan = 'basic') => PLAN_TIER[plan] ?? 0

export const isLowerPlan = (currentPlan, targetPlan) => {
  if (!currentPlan || !targetPlan) return false
  const currentTier = planTierOf(currentPlan)
  const targetTier = planTierOf(targetPlan)
  return currentTier > 0 && targetTier > 0 && targetTier < currentTier
}

export const PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    tagline: 'Untuk UMKM pemula yang baru mulai berjualan online',
    price: { monthly: 10000, yearly: 8000 },
    features: [
      'Hingga 10 produk',
      'Semua section website',
      'Tanpa watermark platform',
      'Penyimpanan media 2 GB',
      'Kasir POS tanpa batas',
      'Ekspor laporan CSV',
    ],
    limits: {
      maxProducts: 10,
      maxSections: Infinity,
      hasWatermark: false,
      hasCustomDomain: true,
      hasAdvancedFinance: false,
      hasCsvExport: true,
      maxImagesGB: 2,
    },
  },
  bisnis: {
    id: 'bisnis',
    name: 'Bisnis',
    badge: 'Paling Populer',
    tagline: 'Untuk toko berkembang yang siap tampil profesional',
    price: { monthly: 30000, yearly: 24000 },
    features: [
      'Hingga 30 produk',
      'Semua section website',
      'Tanpa watermark platform',
      'Custom domain toko sendiri',
      'Penyimpanan media 10 GB',
      'Kasir POS tanpa batas',
      'Ekspor laporan CSV',
    ],
    limits: {
      maxProducts: 30,
      maxSections: Infinity,
      hasWatermark: false,
      hasCustomDomain: true,
      hasAdvancedFinance: false,
      hasCsvExport: true,
      maxImagesGB: 10,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    badge: 'Fitur Lengkap',
    tagline: 'Untuk bisnis dengan laporan keuangan komplit & POS tanpa batas',
    price: { monthly: 50000, yearly: 40000 },
    features: [
      'Semua fitur paket Bisnis',
      'Advanced Finance & laba rugi',
      'Penyimpanan media 25 GB',
      'Kasir POS tanpa batas',
      'Ekspor laporan CSV',
    ],
    limits: {
      maxProducts: Infinity,
      maxSections: Infinity,
      hasWatermark: false,
      hasCustomDomain: true,
      hasAdvancedFinance: true,
      hasCsvExport: true,
      maxImagesGB: 25,
    },
  },
}

/** Harga bulanan/tahunan (tahunan = harga per bulan bila dibayar setahun). */
export const PLAN_PRICE = {
  basic: PLANS.basic.price,
  bisnis: PLANS.bisnis.price,
  pro: PLANS.pro.price,
}

export const isPaidPlan = (plan) => ['basic', 'bisnis', 'pro'].includes(plan)

export const planOf = (plan = 'basic') => PLANS[plan] || (plan === 'gratis' ? PLANS.basic : PLANS.basic)

export const planLimits = (plan = 'basic') => planOf(plan).limits

export const planPrice = (plan = 'basic', period = 'monthly') =>
  planOf(plan).price[period === 'yearly' ? 'yearly' : 'monthly']

/** Total tagihan satu periode (tahunan = 12 x harga per bulan). */
export const planTotal = (plan = 'basic', period = 'monthly') =>
  period === 'yearly' ? planPrice(plan, 'yearly') * 12 : planPrice(plan, 'monthly')
