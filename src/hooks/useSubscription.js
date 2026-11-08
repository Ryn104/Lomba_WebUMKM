import { useState, useCallback, useMemo, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { planLimits, planPrice, planOf, TRIAL_DURATION_DAYS, isLowerPlan } from '../lib/plans'

/**
 * Subscription selection, trial tracking, payment method, and receipts stored on the store record.
 */
export function useSubscription(store, setStore) {
  const normalizeSubscription = useCallback((value = {}) => {
    const now = Date.now()
    const rawPlan = value.plan || 'basic'
    const validPlan = ['basic', 'bisnis', 'pro'].includes(rawPlan) ? rawPlan : 'basic'

    const hasPaidAccess = ['active', 'complimentary'].includes(value.billingMode)
      && (!value.renewsAt || new Date(value.renewsAt).getTime() > now)

    // Hitung tanggal akhir trial 30 hari (1 bulan)
    let trialEndsAt = value.trialEndsAt
    if (!trialEndsAt && value.billingMode !== 'active' && value.billingMode !== 'complimentary' && value.billingMode !== 'expired') {
      const createdAtMs = store?.created_at ? new Date(store.created_at).getTime() : now
      trialEndsAt = new Date(createdAtMs + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
    }

    const trialEndMs = trialEndsAt ? new Date(trialEndsAt).getTime() : 0
    const isTrialActive = !hasPaidAccess && trialEndMs > now
    const trialDaysLeft = isTrialActive ? Math.max(0, Math.ceil((trialEndMs - now) / (1000 * 60 * 60 * 24))) : 0

    let status = 'expired'
    let plan = validPlan
    let billingMode = value.billingMode || (isTrialActive ? 'trial' : 'expired')

    if (hasPaidAccess) {
      status = 'active'
      billingMode = value.billingMode === 'active' ? 'active' : 'complimentary'
      plan = validPlan
    } else if (isTrialActive) {
      status = 'trial'
      billingMode = 'trial'
      // Selama masa trial 1 bulan, user dapat mencoba fitur lengkap (Pro)
      plan = value.plan && ['basic', 'bisnis', 'pro'].includes(value.plan) ? value.plan : 'pro'
    } else {
      status = 'expired'
      billingMode = 'expired'
      plan = validPlan
    }

    return {
      ...value,
      plan,
      status,
      isTrial: status === 'trial',
      isExpired: status === 'expired',
      isPaid: status === 'active',
      trialDaysLeft,
      trialEndsAt: trialEndsAt || null,
      period: value.period === 'yearly' ? 'yearly' : 'monthly',
      renewsAt: hasPaidAccess ? value.renewsAt || null : null,
      billingMode,
      paymentMethod: hasPaidAccess ? value.paymentMethod || null : null,
      invoices: value.invoices || [],
    }
  }, [store?.created_at])

  const getInitialSubscription = useCallback(() => {
    if (store?.theme?.subscription) {
      return normalizeSubscription(store.theme.subscription)
    }
    return normalizeSubscription({ promoDismissed: false })
  }, [store?.theme?.subscription, normalizeSubscription])

  const [subscription, setSubState] = useState(getInitialSubscription)

  // Sinkronkan data server saat user berpindah toko atau data theme berubah.
  useEffect(() => {
    setSubState(normalizeSubscription(store?.theme?.subscription || { promoDismissed: false }))
  }, [store?.id, store?.theme?.subscription, normalizeSubscription])

  // Tulis ke Supabase terlebih dahulu agar UI tidak mengaku berhasil jika penyimpanan gagal.
  const saveSubscription = useCallback(
    async (nextSub) => {
      if (!store?.id) throw new Error('Toko belum siap. Muat ulang halaman lalu coba lagi.')

      const nextTheme = { ...(store.theme || {}), subscription: nextSub }
      const { data, error } = await supabase
        .from('stores')
        .update({ theme: nextTheme })
        .eq('id', store.id)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('Data toko tidak ditemukan saat menyimpan paket.')
      setStore?.(data)
      setSubState(nextSub)
    },
    [store, setStore]
  )

  const plan = subscription.plan || 'basic'
  // Batasan kuota paket berasal dari konstanta paket (src/lib/plans.js).
  const limits = useMemo(() => planLimits(plan), [plan])

  // Simpan aktivasi paket dan catatan pembayaran setelah konfirmasi checkout.
  const upgrade = useCallback(
    async ({ targetPlan = 'bisnis', period = 'monthly', method = 'QRIS', amount } = {}) => {
      if (!['basic', 'bisnis', 'pro'].includes(targetPlan)) {
        toast.error('Paket yang dipilih tidak valid.')
        return false
      }

      if (subscription.isPaid && isLowerPlan(subscription.plan, targetPlan)) {
        toast.error(`Anda sudah berlangganan paket ${planOf(subscription.plan).name}. Tidak dapat membeli paket di bawahnya.`)
        return false
      }

      const now = new Date()
      const renewalDate = new Date(now)
      if (period === 'yearly') renewalDate.setFullYear(renewalDate.getFullYear() + 1)
      else renewalDate.setMonth(renewalDate.getMonth() + 1)

      const monthlyPrice = planPrice(targetPlan, 'monthly')
      const yearlyPrice = planPrice(targetPlan, 'yearly')
      const normalizedPeriod = period === 'yearly' ? 'yearly' : 'monthly'
      const expectedAmount = normalizedPeriod === 'yearly' ? yearlyPrice * 12 : monthlyPrice
      const paidAmount = Number.isFinite(amount) && amount === expectedAmount ? amount : expectedAmount
      const invoiceId = `INV-${now.toISOString().slice(2, 10).replace(/-/g, '')}-${globalThis.crypto.randomUUID().slice(0, 8).toUpperCase()}`
      const targetName = planOf(targetPlan).name
      const newInvoice = {
        id: invoiceId,
        date: now.toISOString(),
        description: `Paket ${targetName} — ${normalizedPeriod === 'yearly' ? 'Tahunan' : 'Bulanan'}`,
        amount: paidAmount,
        status: 'Lunas',
        method,
      }
      const nextSub = {
        ...subscription,
        plan: targetPlan,
        status: 'active',
        period: normalizedPeriod,
        billingMode: 'active',
        activatedAt: now.toISOString(),
        trialEndsAt: null,
        renewsAt: renewalDate.toISOString(),
        paymentMethod: method,
        invoices: [newInvoice, ...(subscription.invoices || [])],
        promoDismissed: true,
      }

      try {
        await saveSubscription(nextSub)
        toast.success(`Paket ${targetName} berhasil diaktifkan.`)
        return true
      } catch (error) {
        toast.error(`Paket gagal disimpan: ${error.message}`)
        return false
      }
    },
    [subscription, saveSubscription]
  )

  // Aktifkan trial 1 bulan
  const startTrial = useCallback(async () => {
    const now = Date.now()
    const trialEndsAt = new Date(now + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const nextSub = {
      ...subscription,
      plan: 'pro',
      status: 'trial',
      billingMode: 'trial',
      activatedAt: new Date(now).toISOString(),
      trialEndsAt,
      renewsAt: null,
      paymentMethod: null,
    }
    try {
      await saveSubscription(nextSub)
      toast.success('Masa trial 1 bulan berhasil diaktifkan! Nikmati semua fitur Pro.')
      return true
    } catch (error) {
      toast.error(`Trial gagal diaktifkan: ${error.message}`)
      return false
    }
  }, [subscription, saveSubscription])

  // Batalkan langganan (kembali ke expired/nonaktif)
  const cancelSubscription = useCallback(async () => {
    const nextSub = {
      ...subscription,
      status: 'expired',
      billingMode: 'expired',
      activatedAt: null,
      renewsAt: null,
      trialEndsAt: null,
      paymentMethod: null,
    }
    try {
      await saveSubscription(nextSub)
      toast.success('Langganan dinonaktifkan.')
    } catch (error) {
      toast.error(`Paket gagal diubah: ${error.message}`)
    }
  }, [subscription, saveSubscription])

  // Dismiss Promo banner
  const dismissPromo = useCallback(async () => {
    const nextSub = {
      ...subscription,
      promoDismissed: true,
    }
    try {
      await saveSubscription(nextSub)
    } catch (error) {
      toast.error(`Perubahan gagal disimpan: ${error.message}`)
    }
  }, [subscription, saveSubscription])

  return {
    subscription,
    plan,
    status: subscription.status || 'expired',
    isTrial: Boolean(subscription.isTrial),
    isExpired: Boolean(subscription.isExpired),
    isPaid: Boolean(subscription.isPaid),
    trialDaysLeft: subscription.trialDaysLeft ?? 0,
    trialEndsAt: subscription.trialEndsAt || null,
    invoices: subscription.invoices || [],
    period: subscription.period || 'monthly',
    renewsAt: subscription.renewsAt || null,
    paymentMethod: subscription.paymentMethod || null,
    promoDismissed: Boolean(subscription.promoDismissed),
    limits,
    upgrade,
    startTrial,
    cancelSubscription,
    dismissPromo,
  }
}
