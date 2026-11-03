import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({ autoComplete = 'current-password', ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="relative block">
      <input className="input pr-11" type={visible ? 'text' : 'password'} autoComplete={autoComplete} {...props} />
      <button
        type="button"
        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  )
}