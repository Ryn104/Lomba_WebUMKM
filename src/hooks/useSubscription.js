import { useState, useCallback, useMemo, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

/**
 * Subscription selection, payment method, and generated receipt are stored on the store record.
 */
export function useSubscription(store, setStore) {
  const normalizeSubscription = (value = {}) => {
    const hasSubscriptionAccess = ['active', 'complimentary'].includes(value.billingMode)
      && (!value.renewsAt || new Date(value.renewsAt).getTime() > Date.now())
    const plan = hasSubscriptionAccess && ['bisnis', 'pro'].includes(value.plan) ? value.plan : 'gratis'
    return {
      ...value,
      plan,
      status: 'active',
      period: value.period === 'yearly' ? 'yearly' : 'monthly',
      trialEndsAt: null,
      renewsAt: plan === 'gratis' ? null : value.renewsAt || null,
      billingMode: plan === 'gratis' ? 'free' : value.billingMode === 'active' ? 'active' : 'complimentary',
      paymentMethod: plan === 'gratis' ? null : value.paymentMethod || null,
      invoices: value.invoices || [],
    }
  }

  const getInitialSubscription = () => {
    if (store?.theme?.subscription) {
      return normalizeSubscription(store.theme.subscription)
    }
    return normalizeSubscription({ promoDismissed: false })
  }

  const [subscription, setSubState] = useState(getInitialSubscription)

  // Sinkronkan data server saat user berpindah toko atau data theme berubah.
  useEffect(() => {
    setSubState(normalizeSubscription(store?.theme?.subscription || { promoDismissed: false }))
  }, [store?.id, store?.theme?.subscription])

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

  const plan = subscription.plan || 'gratis'
  // Batasan kuota paket
  const limits = useMemo(() => {
    const isPaid = plan !== 'gratis'
    return {
      maxProducts: isPaid ? Infinity : 10,
      maxSections: isPaid ? Infinity : 3,
      hasWatermark: !isPaid,
      hasCustomDomain: isPaid,
      hasAdvancedFinance: plan === 'pro',
      maxImagesGB: plan === 'pro' ? 20 : isPaid ? 5 : 0.5,
      maxPosMonthly: plan === 'pro' ? Infinity : isPaid ? 500 : 50,
    }
  }, [plan])

  // Simpan aktivasi paket dan catatan pembayaran setelah konfirmasi checkout.
  const upgrade = useCallback(
    async ({ targetPlan = 'bisnis', period = 'monthly', method = 'QRIS', amount } = {}) => {
      if (!['bisnis', 'pro'].includes(targetPlan)) {
        toast.error('Paket yang dipilih tidak valid.')
        return false
      }

      const now = new Date()
      const renewalDate = new Date(now)
      if (period === 'yearly') renewalDate.setFullYear(renewalDate.getFullYear() + 1)
      else renewalDate.setMonth(renewalDate.getMonth() + 1)

      const monthlyPrice = targetPlan === 'pro' ? 149000 : 79000
      const yearlyPrice = targetPlan === 'pro' ? 119000 : 63000
      const normalizedPeriod = period === 'yearly' ? 'yearly' : 'monthly'
      const expectedAmount = normalizedPeriod === 'yearly' ? yearlyPrice * 12 : monthlyPrice
      const paidAmount = Number.isFinite(amount) && amount === expectedAmount ? amount : expectedAmount
      const invoiceId = `INV-${now.toISOString().slice(2, 10).replace(/-/g, '')}-${globalThis.crypto.randomUUID().slice(0, 8).toUpperCase()}`
      const newInvoice = {
        id: invoiceId,
        date: now.toISOString(),
        description: `Paket ${targetPlan === 'pro' ? 'Pro' : 'Bisnis'} — ${normalizedPeriod === 'yearly' ? 'Tahunan' : 'Bulanan'}`,
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
        toast.success(`Paket ${targetPlan === 'pro' ? 'Pro' : 'Bisnis'} berhasil diaktifkan.`)
        return true
      } catch (error) {
        toast.error(`Paket gagal disimpan: ${error.message}`)
        return false
      }
    },
    [subscription, saveSubscription]
  )

  // Kembalikan akses ke paket Gratis.
  const cancelSubscription = useCallback(async () => {
    const nextSub = {
      ...subscription,
      plan: 'gratis',
      status: 'active',
      billingMode: 'free',
      activatedAt: null,
      renewsAt: null,
      trialEndsAt: null,
      paymentMethod: null,
    }
    try {
      await saveSubscription(nextSub)
      toast.success('Paket Gratis sekarang aktif kembali.')
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
    invoices: subscription.invoices || [],
    period: subscription.period || 'monthly',
    renewsAt: subscription.renewsAt || null,
    paymentMethod: subscription.paymentMethod || null,
    promoDismissed: Boolean(subscription.promoDismissed),
    limits,
    upgrade,
    cancelSubscription,
    dismissPromo,
  }
}
