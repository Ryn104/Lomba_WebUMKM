import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const { error } = await resetPassword(email)
    setBusy(false)
    if (error) return toast.error(error.message)
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50/50 via-slate-50 to-slate-100 p-4">
      <div className="card w-full max-w-md p-8 shadow-sm">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-extrabold text-slate-900">
          <span className="rounded-lg bg-brand-700 p-1.5 text-white"><Store size={18} /></span> UMKM Builder
        </Link>
        <h1 className="text-center text-xl font-bold text-slate-900">Lupa password?</h1>

        {sent ? (
          <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
            Jika email <b>{email}</b> terdaftar, tautan untuk mengatur ulang password sudah dikirim.
            Cek kotak masuk (dan folder spam).
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-center text-sm text-slate-500">
              Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password baru.
            </p>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Mengirim…' : 'Kirim tautan reset'}</button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Kembali ke halaman masuk</Link>
        </p>
      </div>
    </div>
  )
}