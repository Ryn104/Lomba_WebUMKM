import { Clock } from 'lucide-react'
import { formatDate } from '../../lib/utils'

export default function TrialBanner({ trialDaysLeft = 30, renewsAt, onUpgrade }) {
  const formattedEndDate = renewsAt ? formatDate(renewsAt) : '30 hari lagi'

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 p-4 sm:p-5 text-white shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-200 backdrop-blur-sm">
            <Clock size={20} />
          </span>
          <div>
            <h3 className="font-bold text-white text-base">
              Masa uji coba 1 bulan tersisa {trialDaysLeft} hari
            </h3>
            <p className="mt-0.5 text-xs text-brand-100 opacity-90">
              {renewsAt ? `Berakhir pada ${formattedEndDate}. ` : ''}Pilih paket langganan (Basic, Bisnis, atau Pro) agar fitur toko Anda tetap aktif.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Countdown Hari */}
          <div className="flex items-center gap-1.5 text-center font-mono">
            <div className="rounded-lg bg-black/25 px-3 py-1.5 backdrop-blur-sm border border-white/10">
              <span className="block text-base font-black leading-tight text-white">
                {String(trialDaysLeft).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-brand-200">hari tersisa</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onUpgrade}
            className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-bold text-brand-800 shadow transition hover:bg-brand-50 active:scale-95"
          >
            Pilih paket sekarang
          </button>
        </div>
      </div>
    </div>
  )
}
