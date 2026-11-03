import { useEffect, useState } from 'react'

const initialsOf = (name) => {
  const first = (name || '').trim().charAt(0)
  return first ? first.toUpperCase() : '?'
}

/** Avatar pengguna: foto profil jika ada, atau default inisial nama dengan warna brand. */
export default function Avatar({ name = '', src = '', variant = 'solid', className = 'h-9 w-9 text-sm', alt = '', ...imgProps }) {
  const [broken, setBroken] = useState(false)
  useEffect(() => { setBroken(false) }, [src])

  if (src && !broken) {
    return <img {...imgProps} src={src} alt={alt} className={`shrink-0 rounded-full bg-slate-200 object-cover ${className}`} />
  }

  const tones = variant === 'soft' ? 'bg-brand-50 text-brand-700' : 'bg-brand-700 text-white'
  return (
    <span role="img" aria-label={alt || `Avatar ${name || 'pengguna'}`} className={`flex shrink-0 items-center justify-center rounded-full font-bold ${tones} ${className}`}>
      {initialsOf(name)}
    </span>
  )
}