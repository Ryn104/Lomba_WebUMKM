import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Store } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GoogleButton from '../components/ui/GoogleButton'
import Logo from '../components/ui/Logo'

const OTP_LENGTH = 6
const RESEND_SECONDS = 60

export default function RegisterPage() {
  const { isEmailRegistered, sendSignupOtp, verifySignupOtp, completeSignup } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [step, setStep] = useState('form') // 'form' | 'otp'
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [verified, setVerified] = useState(false) // OTP sudah benar, tinggal simpan password
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  // hitung mundur untuk tombol kirim ulang
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Langkah 1: hanya kirim kode OTP. Nama & password disimpan di state browser,
  // belum dikirim/disimpan ke database sampai OTP benar.
  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password minimal 6 karakter')
    setBusy(true)
    const { registered, error: checkErr } = await isEmailRegistered(form.email)
    if (checkErr) {
      setBusy(false)
      return toast.error('Gagal memeriksa email. Coba lagi.')
    }
    if (registered) {
      setBusy(false)
      return toast.error('Email sudah terdaftar. Silakan masuk.')
    }
    const { error } = await sendSignupOtp(form.email)
    setBusy(false)
    if (error) return toast.error(error.message)

    toast.success('Kode verifikasi dikirim ke email Anda')
    setCooldown(RESEND_SECONDS)
    setStep('otp')
  }

  // Langkah 2: data registrasi baru disimpan setelah OTP benar.
  const verify = async (e) => {
    e.preventDefault()
    if (!verified && otp.length !== OTP_LENGTH) return toast.error(`Kode harus ${OTP_LENGTH} digit`)
    setBusy(true)

    if (!verified) {
      const { error } = await verifySignupOtp(form.email, otp)
      if (error) {
        setBusy(false)
        return toast.error('Kode salah atau sudah kedaluwarsa')
      }
      setVerified(true)
    }

    const { error: saveErr } = await completeSignup({ password: form.password, full_name: form.name })
    setBusy(false)
    if (saveErr) return toast.error('Email terverifikasi, tetapi data akun gagal disimpan. Coba lagi.')

    toast.success('Email terverifikasi! Silakan buat toko Anda.')
    nav('/dashboard', { replace: true })
  }

  const resend = async () => {
    const { error } = await sendSignupOtp(form.email)
    if (error) return toast.error(error.message)
    toast.success('Kode baru telah dikirim')
    setCooldown(RESEND_SECONDS)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50/50 via-slate-50 to-slate-100 p-4">
      <div className="card w-full max-w-md p-8 shadow-sm">
        <Link to="/" className="mb-6 flex justify-center"><Logo size="lg" /></Link>
        {step === 'form' ? (
          <>
            <h1 className="text-center text-xl font-bold text-slate-900">Daftar akun UMKM</h1>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label">Nama lengkap</label>
                <input className="input" required placeholder="Masukkan nama lengkap" value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" required placeholder="nama@email.com" value={form.email} onChange={set('email')} />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" required minLength={6} placeholder="Buat kata sandi (min. 6 karakter)" value={form.password} onChange={set('password')} />
              </div>
              <button className="btn-primary w-full" disabled={busy}>{busy ? 'Memproses…' : 'Daftar'}</button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" /> atau <span className="h-px flex-1 bg-slate-200" />
            </div>
            <GoogleButton label="Daftar dengan Google" redirectPath="/dashboard" />

            <p className="mt-5 text-center text-sm text-slate-500">
              Sudah punya akun? <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Masuk</Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-center text-xl font-bold text-slate-900">Verifikasi email</h1>
            <p className="mt-2 text-center text-sm text-slate-500">
              Kami mengirim kode {OTP_LENGTH} digit ke <b className="text-slate-800">{form.email}</b>.
              Cek juga folder spam.
            </p>
            <form onSubmit={verify} className="mt-6 space-y-4">
              <input
                className="input text-center font-mono text-2xl tracking-[0.5em]"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_LENGTH}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                disabled={verified}
              />
              <button className="btn-primary w-full" disabled={busy || (!verified && otp.length !== OTP_LENGTH)}>
                {busy ? 'Memproses…' : verified ? 'Simpan ulang data akun' : 'Verifikasi'}
              </button>
            </form>
            <div className="mt-4 flex items-center justify-between text-sm">
              <button type="button" className="text-slate-500 hover:text-slate-800 disabled:opacity-40" disabled={verified} onClick={() => { setStep('form'); setOtp('') }}>
                ← Ganti email
              </button>
              <button
                className="font-semibold text-brand-700 hover:text-brand-800 disabled:text-slate-400"
                type="button"
                disabled={cooldown > 0 || verified}
                onClick={resend}
              >
                {cooldown > 0 ? `Kirim ulang (${cooldown}d)` : 'Kirim ulang kode'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}