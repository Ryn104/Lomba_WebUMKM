import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowRight, Check, ExternalLink, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useMyStore } from '../hooks/useMyStore'
import { useSubscription } from '../hooks/useSubscription'
import { supabase, PLATFORM_DOMAIN } from '../lib/supabase'
import { planOf } from '../lib/plans'
import { Spinner } from '../components/ui/Field'
import Logo from '../components/ui/Logo'
import OnboardingStepper from '../components/onboarding/OnboardingStepper'
import StoreStep from '../components/onboarding/StoreStep'
import PlanStep from '../components/onboarding/PlanStep'
import UpgradeModal from '../components/subscription/UpgradeModal'

/** Wizard onboarding 3 langkah setelah registrasi (email OTP maupun Google). */
export default function OnboardingPage() {
  const { user, profile, isAdmin } = useAuth()
  const nav = useNavigate()
  const { store, setStore, loading, reload } = useMyStore()
  const { plan, upgrade } = useSubscription(store, setStore)

  const [step, setStep] = useState(1)
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const [targetPlan, setTargetPlan] = useState(null)
  const [finishing, setFinishing] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (loading) return
    if (isAdmin) {
      nav('/admin', { replace: true })
      return
    }
    if (finished) return
    if (!store) {
      if (step !== 1) setStep(1)
      return
    }
    if (store.theme?.onboarding_done) {
      nav('/dashboard', { replace: true })
      return
    }
    if (step === 1) setStep(2)
  }, [loading, isAdmin, store, finished, step, nav])

  // Baca ulang toko agar penanda onboarding tidak menimpa subscription yang baru disimpan.
  const markOnboardingDone = async () => {
    const { data: fresh, error } = await supabase.from('stores').select('*').eq('id', store.id).single()
    if (error) throw error
    const nextTheme = { ...(fresh.theme || {}), onboarding_done: true }
    const { data: updated, error: updateError } = await supabase
      .from('stores')
      .update({ theme: nextTheme })
      .eq('id', store.id)
      .select()
      .single()
    if (updateError) throw updateError
    setStore(updated)
    return updated
  }

  const finishWithPlan = async (label) => {
    setFinishing(true)
    try {
      await markOnboardingDone()
      toast.success(label)
      setFinished(true)
      setStep(3)
    } catch (error) {
      toast.error(`Paket tersimpan, tetapi status onboarding gagal disimpan: ${error.message}`)
    } finally {
      setFinishing(false)
    }
  }

  const pickPlan = async (planId) => {
    if (planId === 'gratis') {
      await finishWithPlan('Paket Gratis aktif. Selamat berjualan!')
      return
    }
    setTargetPlan(planId)
  }

  const handleUpgradeSuccess = async ({ targetPlan: selectedPlan, period, method, amount }) => {
    const activated = await upgrade({ targetPlan: selectedPlan, period, method, amount })
    if (!activated) return false
    setTargetPlan(null)
    await finishWithPlan(`Paket ${planOf(selectedPlan).name} berhasil diaktifkan.`)
    return true
  }

  if (loading) return <Spinner full />

  const activePlanName = planOf(plan).name

  return (
    <div className="app-bg min-h-[100dvh] bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex justify-center sm:justify-start">
          <Logo size="lg" />
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <OnboardingStepper step={step} />

          <div className="mt-6">
            {step === 1 && (
              <StoreStep
                user={user}
                profile={profile}
                store={store}
                onCreated={async () => {
                  if (!store) await reload()
                  setStep(2)
                }}
              />
            )}

            {step === 2 && store && (
              <PlanStep
                period={billingPeriod}
                setPeriod={setBillingPeriod}
                onPick={pickPlan}
                onBack={() => setStep(1)}
                busy={finishing}
              />
            )}

            {step === 3 && (
              <div className="py-4 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check size={32} />
                </span>
                <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Toko Anda siap!</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                  {store?.name} sudah dibuat dengan paket <b>{activePlanName}</b>. Anda bisa mulai menambah produk dan mengatur website toko.
                </p>

                <div className="mx-auto mt-5 max-w-md rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm">
                  <p className="flex items-center gap-2 font-semibold text-slate-900">
                    <Sparkles size={16} className="text-brand-700" /> Alamat website toko
                  </p>
                  <a
                    href={`/${store?.slug || ''}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 break-all font-mono text-xs font-semibold text-brand-700 hover:text-brand-800"
                  >
                    {PLATFORM_DOMAIN}/{store?.slug} <ExternalLink size={12} />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => nav('/dashboard', { replace: true })}
                  className="btn-primary mx-auto mt-6 justify-center px-6 py-2.5 font-bold"
                >
                  Ke Dashboard <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <UpgradeModal
        open={Boolean(targetPlan)}
        onClose={() => setTargetPlan(null)}
        targetPlan={targetPlan || 'bisnis'}
        currentPeriod={billingPeriod}
        onSuccess={handleUpgradeSuccess}
      />
    </div>
  )
}
