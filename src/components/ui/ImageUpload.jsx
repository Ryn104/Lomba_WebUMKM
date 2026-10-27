import { useRef, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadImage } from '../../lib/supabase'

export default function ImageUpload({ value, onChange, folder = 'misc', className = 'h-32 w-32', hint = 'Max 3mb' }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)

  const pick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) return toast.error('Ukuran gambar maksimal 3MB')
    setBusy(true)
    try {
      onChange(await uploadImage(file, folder))
    } catch (err) {
      toast.error('Upload gagal: ' + err.message)
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`relative flex ${className} flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-brand-400`}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <ImagePlus size={24} />
            {hint && <span className="text-[11px] font-medium leading-none">{hint}</span>}
          </>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="animate-spin" />
          </span>
        )}
      </button>
      {value && (
        <button type="button" className="text-xs text-red-500 hover:underline" onClick={() => onChange('')}>
          Hapus
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick} />
    </div>
  )
}