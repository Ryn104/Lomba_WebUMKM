import { Clock } from 'lucide-react'
import { formatDate } from '../../lib/utils'

export default function TrialBanner({ trialDaysLeft = 9, renewsAt, onUpgrade }) {
  // Format tanggal berakhir
  const formattedEndDate = renewsAt ? formatDate(renewsAt) : '5 Nov 2026'

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 p-4 sm:p-5 text-white shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-200 backdrop-blur-sm">
            <Clock size={20} />
          </span>
          <div>
            <h3 className="font-bold text-white text-base">
              Masa uji coba Bisnis tersisa {trialDaysLeft} hari
            </h3>
            <p className="mt-0.5 text-xs text-brand-100 opacity-90">
              Berakhir {formattedEndDate}. Upgrade sekarang agar website tidak kehilangan fitur Bisnis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Countdown Boxes */}
          <div className="flex items-center gap-1.5 text-center font-mono">
            <div className="rounded-lg bg-black/25 px-2.5 py-1.5 backdrop-blur-sm border border-white/10">
              <span className="block text-sm font-black leading-tight text-white">
                {String(trialDaysLeft).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-brand-200">hari</span>
            </div>
            <div className="rounded-lg bg-black/25 px-2.5 py-1.5 backdrop-blur-sm border border-white/10">
              <span className="block text-sm font-black leading-tight text-white">14</span>
              <span className="text-[10px] text-brand-200">jam</span>
            </div>
            <div className="rounded-lg bg-black/25 px-2.5 py-1.5 backdrop-blur-sm border border-white/10">
              <span className="block text-sm font-black leading-tight text-white">22</span>
              <span className="text-[10px] text-brand-200">menit</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onUpgrade}
            className="shrink-0 rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-bold text-brand-800 shadow transition hover:bg-brand-50 active:scale-95"
          >
            Upgrade sekarang
          </button>
        </div>
      </div>
    </div>
  )
}
