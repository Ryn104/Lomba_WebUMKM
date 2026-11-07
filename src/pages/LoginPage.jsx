import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import GoogleButton from '../components/ui/GoogleButton'
import Logo from '../components/ui/Logo'
import PasswordInput from '../components/ui/PasswordInput'

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
      const msg =
        error.message === 'Invalid login credentials' ? 'Email atau password salah'
        : error.message === 'Email not confirmed' ? 'Email belum diverifikasi. Daftar ulang atau minta kode baru.'
        : error.message
      return toast.error(msg)
    }
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    const { data: ownedStore } = await supabase
      .from('stores')
      .select('id,theme')
      .eq('owner_id', data.user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    setBusy(false)
    toast.success('Berhasil masuk')
    const from = loc.state?.from?.pathname
    const needsOnboarding = prof?.role !== 'admin' && (!ownedStore || !ownedStore.theme?.onboarding_done)
    const dest = prof?.role === 'admin'
      ? (from?.startsWith('/admin') ? from : '/admin')
      : needsOnboarding
        ? '/onboarding'
        : (from || '/dashboard')
    nav(dest, { replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50/50 via-slate-50 to-slate-100 p-4">
      <div className="card w-full max-w-md p-8 shadow-sm">
        <Link to="/" className="mb-6 flex justify-center"><Logo size="lg" /></Link>
        <h1 className="text-center text-xl font-bold text-slate-900">Masuk ke akun Anda</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Password</label>
            <PasswordInput required placeholder="Masukkan kata sandi" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="text-right">
            <Link to="/lupa-password" className="text-sm font-medium text-brand-700 hover:text-brand-800">
              Lupa password?
            </Link>
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> atau <span className="h-px flex-1 bg-slate-200" />
        </div>
        <GoogleButton redirectPath={loc.state?.from?.pathname || '/dashboard'} />
        <p className="mt-5 text-center text-sm text-slate-500">
          Belum punya akun? <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">Daftar</Link>
        </p>
      </div>
    </div>
  )
}
