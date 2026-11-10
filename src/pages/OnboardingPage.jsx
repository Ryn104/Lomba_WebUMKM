import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, ExternalLink, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useMyStore } from "../hooks/useMyStore";
import { useSubscription } from "../hooks/useSubscription";
import { supabase, PLATFORM_DOMAIN } from "../lib/supabase";
import { planOf } from "../lib/plans";
import { Spinner } from "../components/ui/Field";
import Logo from "../components/ui/Logo";
import { ThemeIconButton } from "../components/ui/ThemeToggle";
import OnboardingStepper from "../components/onboarding/OnboardingStepper";
import StoreStep from "../components/onboarding/StoreStep";
import PlanStep from "../components/onboarding/PlanStep";
import UpgradeModal from "../components/subscription/UpgradeModal";

const animationCss = `
@keyframes lp-fade-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes lp-drift { 0%, 100% { transform: translate(-50%, 0) scale(1); } 50% { transform: translate(-46%, 24px) scale(1.1); } }
.lp-fade-up { opacity: 0; animation: lp-fade-up .9s cubic-bezier(.2,.7,.2,1) forwards; }
.lp-drift { animation: lp-drift 12s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .lp-fade-up { opacity: 1; animation: none; }
  .lp-drift { animation: none; }
}
`;

export default function OnboardingPage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const nav = useNavigate();
  const { store, setStore, loading } = useMyStore();
  const { plan, isTrial, upgrade, startTrial } = useSubscription(store, setStore);

  const [step, setStep] = useState(1);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [targetPlan, setTargetPlan] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (isAdmin) {
      nav("/admin", { replace: true });
      return;
    }
    if (!store) {
      if (step !== 1) setStep(1);
      return;
    }
    if (finished) return;
    if (store.theme?.onboarding_done) {
      nav("/dashboard", { replace: true });
      return;
    }
    if (step === 1) setStep(2);
  }, [loading, isAdmin, store, finished, step, nav]);

  const markOnboardingDone = async () => {
    if (!store?.id) throw new Error("Toko belum siap.");
    const { data: fresh, error } = await supabase.from("stores").select("*").eq("id", store.id).single();
    if (error) throw error;
    const nextTheme = { ...(fresh.theme || {}), onboarding_done: true };
    const { data: updated, error: updateError } = await supabase.from("stores").update({ theme: nextTheme }).eq("id", store.id).select().single();
    if (updateError) throw updateError;
    setStore(updated);
  };

  const finishWithPlan = async (label) => {
    setFinishing(true);
    try {
      await markOnboardingDone();
      toast.success(label);
      setFinished(true);
      setStep(3);
    } catch (error) {
      toast.error(`Paket tersimpan, tetapi status onboarding gagal disimpan: ${error.message}`);
    } finally {
      setFinishing(false);
    }
  };

  const pickPlan = async (planId) => {
    if (planId === "trial" || planId === "gratis") {
      const started = await startTrial?.();
      if (!started) return;
      await finishWithPlan("Trial 1 Bulan aktif! Selamat berjualan.");
      return;
    }
    setTargetPlan(planId);
  };

  const handleUpgradeSuccess = async ({ targetPlan: selectedPlan, period, method, amount }) => {
    const activated = await upgrade({ targetPlan: selectedPlan, period, method, amount });
    if (!activated) return false;
    setTargetPlan(null);
    await finishWithPlan(`Paket ${planOf(selectedPlan).name} berhasil diaktifkan.`);
    return true;
  };

  if (loading) return <Spinner full />;

  const activePlanName = isTrial ? "Trial 1 Bulan" : planOf(plan).name;

  return (
    <div className="app-bg min-h-[100dvh] bg-[#F8FAFC]">
      <style>{animationCss}</style>

      {/* Tombol ganti tema di kanan atas */}
      <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
        <ThemeIconButton className="btn-secondary !rounded-full" />
      </div>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(148,163,184,0.28)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="lp-drift pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-16 sm:pt-20">
          <div className="lp-fade-up mb-8 text-center" style={{ animationDelay: "100ms" }}>
            <div className="mb-6 flex justify-center text-slate-900">
              <Logo />
            </div>
            <p className="text-sm font-semibold text-brand-600">Persiapan Toko</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Mulai berjualan dengan UMKITA</h1>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">Tinggal beberapa langkah lagi sampai toko Anda online.</p>
          </div>

          <div className="card lp-fade-up overflow-hidden shadow-xl shadow-slate-900/5" style={{ animationDelay: "250ms" }}>
            <div className="border-b border-slate-500/20 bg-slate-500/5 p-6 sm:p-8">
              <OnboardingStepper step={step} />
            </div>

            <div className="p-6 sm:p-8">
              {step === 1 && (
                <StoreStep
                  user={user}
                  profile={profile}
                  store={store}
                  onCreated={(created) => {
                    if (!created?.id) {
                      toast.error("Toko gagal dibuat. Coba lagi.");
                      return;
                    }
                    setStore(created);
                    setStep(2);
                  }}
                />
              )}

              {step === 2 && store && <PlanStep period={billingPeriod} setPeriod={setBillingPeriod} onPick={pickPlan} onBack={() => setStep(1)} busy={finishing} />}

              {step === 3 && (
                <div className="py-4 text-center">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/15 text-brand-500 ring-8 ring-brand-500/10">
                    <Check size={32} />
                  </span>
                  <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">Toko Anda siap!</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                    {store?.name} sudah siap dengan paket <b>{activePlanName}</b>. Anda bisa mulai menambah produk dan mengatur website toko.
                  </p>

                  <div className="mx-auto mt-5 max-w-md rounded-xl border border-slate-500/20 bg-slate-500/10 p-4 text-left text-sm">
                    <p className="flex items-center gap-2 font-semibold text-slate-900">
                      <Sparkles size={16} className="text-brand-500" /> Alamat website toko
                    </p>
                    <a
                      href={`/${store?.slug || ""}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 break-all font-mono text-xs font-semibold text-brand-600 hover:underline"
                    >
                      {PLATFORM_DOMAIN}/{store?.slug} <ExternalLink size={12} />
                    </a>
                  </div>

                  <button type="button" onClick={() => nav("/dashboard", { replace: true })} className="btn-primary group !rounded-full mx-auto mt-6 justify-center px-6 py-2.5 font-bold">
                    Ke Dashboard <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <UpgradeModal
        open={Boolean(targetPlan)}
        onClose={() => setTargetPlan(null)}
        targetPlan={targetPlan || "bisnis"}
        currentPeriod={billingPeriod}
        onSuccess={handleUpgradeSuccess}
      />
    </div>
  );
}