import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { data, error } = await signIn(email, password)
    if (error) {
      setBusy(false)
      return toast.error(error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message)
    }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    setBusy(false)
    toast.success('Berhasil masuk')
    const dest = loc.state?.from?.pathname || (prof?.role === 'admin' ? '/admin' : '/dashboard')
    nav(dest, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50/50 via-slate-50 to-slate-100 p-4">
      <div className="card w-full max-w-md p-8 shadow-sm">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-extrabold text-slate-900">
          <span className="rounded-lg bg-brand-700 p-1.5 text-white"><Store size={18} /></span> UMKM Builder
        </Link>
        <h1 className="text-center text-xl font-bold text-slate-900">Masuk ke akun Anda</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          Belum punya akun? <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">Daftar</Link>
        </p>
      </div>
    </div>
  )
}
