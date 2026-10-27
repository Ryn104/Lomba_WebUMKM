import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { signUp } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password minimal 6 karakter')
    setBusy(true)
    const { data, error } = await signUp(form.email, form.password, form.name)
    setBusy(false)
    if (error) return toast.error(error.message)
    if (data.session) {
      toast.success('Akun dibuat! Silakan buat toko Anda.')
      nav('/dashboard')
    } else {
      toast.success('Cek email Anda untuk konfirmasi, lalu masuk.', { duration: 6000 })
      nav('/login')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50/50 via-slate-50 to-slate-100 p-4">
      <div className="card w-full max-w-md p-8 shadow-sm">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-extrabold text-slate-900">
          <span className="rounded-lg bg-brand-700 p-1.5 text-white"><Store size={18} /></span> UMKM Builder
        </Link>
        <h1 className="text-center text-xl font-bold text-slate-900">Daftar akun UMKM</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Nama lengkap</label>
            <input className="input" required value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required minLength={6} value={form.password} onChange={set('password')} />
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Memproses…' : 'Daftar'}</button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          Sudah punya akun? <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
