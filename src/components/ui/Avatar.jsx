import { useEffect, useState } from 'react'

/** Inisial 1–2 huruf: dari nama lengkap, atau bagian sebelum @ bila yang diberikan email. */
const initialsOf = (value) => {
  const clean = String(value || '').trim()
  if (!clean) return '?'
  const source = clean.includes('@') ? clean.split('@')[0].replace(/[._-]+/g, ' ') : clean
  const words = source.split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || '?'
}

/**
 * Avatar pengguna: foto profil bila ada, atau inisial nama dengan warna brand.
 * Gambar eksternal (mis. foto Google) memakai referrerPolicy="no-referrer";
 * bila gagal dimuat, avatar otomatis berubah menjadi inisial.
 */
export default function Avatar({
  name = '',
  src = '',
  variant = 'solid',
  className = 'h-9 w-9 text-sm',
  alt = '',
  referrerPolicy = 'no-referrer',
  onError,
  ...imgProps
}) {
  const [broken, setBroken] = useState(false)
  useEffect(() => { setBroken(false) }, [src])

  if (src && !broken) {
    return (
      <img
        {...imgProps}
        src={src}
        alt={alt || `Foto profil ${name || 'pengguna'}`}
        referrerPolicy={referrerPolicy}
        className={`shrink-0 rounded-full bg-slate-200 object-cover ${className}`}
        onError={(event) => {
          setBroken(true)
          onError?.(event)
        }}
      />
    )
  }

  const tones = variant === 'soft' ? 'bg-brand-50 text-brand-700' : 'bg-brand-700 text-white'
  return (
    <span
      role="img"
      aria-label={alt || `Avatar ${name || 'pengguna'}`}
      className={`flex shrink-0 items-center justify-center rounded-full font-bold ${tones} ${className}`}
    >
      {initialsOf(name)}
    </span>
  )
}