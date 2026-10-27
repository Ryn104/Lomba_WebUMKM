import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui/Field'

export default function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth()
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 6) return toast.error('Password minimal 6 karakter')
    if (password !== confirm) return toast.error('Konfirmasi password tidak sama')
    setBusy(true)
    const { error } = await updatePassword(password)
    setBusy(false)
    if (error) return toast.error(error.message)
    toast.success('Password berhasil diubah')
    nav('/dashboard', { replace: true })
  }

  if (loading) return <Spinner full />

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50/50 via-slate-50 to-slate-100 p-4">
      <div className="card w-full max-w-md p-8 shadow-sm">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-extrabold text-slate-900">
          <span className="rounded-lg bg-brand-700 p-1.5 text-white"><Store size={18} /></span> UMKM Builder
        </Link>
        <h1 className="text-center text-xl font-bold text-slate-900">Buat password baru</h1>

        {!session ? (
          <div className="mt-6 space-y-3 text-center text-sm text-slate-600">
            <p>Tautan tidak valid atau sudah kedaluwarsa.</p>
            <Link to="/lupa-password" className="btn-primary inline-flex">Minta tautan baru</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Password baru</label>
              <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="label">Ulangi password baru</label>
              <input className="input" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan password'}</button>
          </form>
        )}
      </div>
    </div>
  )
}