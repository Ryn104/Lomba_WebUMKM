import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, MailCheck, ShieldCheck, Link2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function AccountSecurityPage() {
  const { user, updatePassword } = useAuth()
  const location = useLocation()
  const [identities, setIdentities] = useState([])
  const [authProviders, setAuthProviders] = useState(user?.app_metadata?.providers || [])
  const [identitiesLoading, setIdentitiesLoading] = useState(true)
  const [identitiesError, setIdentitiesError] = useState(false)
  const [linkingGoogle, setLinkingGoogle] = useState(false)
  const [unlinkingGoogle, setUnlinkingGoogle] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (password.length < 8) return toast.error('Password minimal 8 karakter.')
    if (password !== confirmation) return toast.error('Konfirmasi password tidak sama.')
    setSaving(true)
    try {
      const { error } = await updatePassword(password)
      if (error) throw error
      setPassword('')
      setConfirmation('')
      toast.success('Password berhasil diperbarui.')
    } catch (error) {
      toast.error(`Password gagal diperbarui: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const emailVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at)
  const googleIdentity = identities.find((identity) => identity.provider === 'google') || null
  const googleEmail = typeof googleIdentity?.identity_data?.email === 'string' ? googleIdentity.identity_data.email : ''
  const hasAlternativeLogin = identities.some((identity) => {
    if (identity.provider === 'google') return false
    if (authProviders.includes(identity.provider)) return true
    return identity.provider === 'email' && (authProviders.includes('password') || authProviders.includes('email'))
  })
  const canUnlinkGoogle = Boolean(googleIdentity && hasAlternativeLogin)

  const loadIdentities = useCallback(async () => {
    setIdentitiesLoading(true)
    setIdentitiesError(false)
    try {
      const [{ data, error }, { data: authData, error: authError }] = await Promise.all([
        supabase.auth.getUserIdentities(),
        supabase.auth.getUser(),
      ])
      if (error) throw error
      if (authError) throw authError
      setIdentities(data.identities || [])
      setAuthProviders(authData.user?.app_metadata?.providers || [])
      return data.identities || []
    } catch (error) {
      setIdentitiesError(true)
      toast.error(`Status akun terhubung tidak dapat dimuat: ${error.message}`)
      return null
    } finally {
      setIdentitiesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadIdentities()
  }, [loadIdentities, user?.id])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('google_link') !== '1') return

    const expectedUserId = sessionStorage.getItem('umkm-google-link-user')
    sessionStorage.removeItem('umkm-google-link-user')
    window.history.replaceState({}, document.title, `${location.pathname}${location.hash}`)

    let alive = true
    const verifyLinkResult = async () => {
      try {
        const oauthError = params.get('error') || params.get('error_code')
        if (oauthError) {
          const detail = `${oauthError} ${params.get('error_description') || ''}`.toLowerCase()
          const message = detail.includes('identity') || detail.includes('already')
            ? 'Akun Google ini sudah tertaut ke akun lain. Tidak ada akun yang digabungkan.'
            : detail.includes('access_denied') || detail.includes('cancel')
              ? 'Proses menyambungkan Google dibatalkan.'
              : 'Google belum berhasil disambungkan. Coba lagi.'
          if (alive) {
            toast.error(message)
            if (expectedUserId) await loadIdentities()
          }
          return
        }

        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError || !authData.user) throw authError || new Error('Sesi login telah berakhir.')
        if (!expectedUserId || authData.user.id !== expectedUserId || authData.user.id !== user?.id) {
          await supabase.auth.signOut({ scope: 'local' })
          toast.error('Koneksi akun berubah selama proses. Masuk kembali ke akun semula untuk melanjutkan.')
          return
        }

        const currentIdentities = await loadIdentities()
        if (!currentIdentities) throw new Error('Status identitas Google tidak dapat diperiksa.')
        if (!alive) return
        const linked = currentIdentities.some((identity) => identity.provider === 'google')
        if (linked) toast.success('Akun Google berhasil disambungkan.')
        else toast.error('Google belum tertaut ke akun ini. Coba sambungkan kembali.')
      } catch (error) {
        if (alive) toast.error(`Tidak dapat memverifikasi koneksi Google: ${error.message}`)
      }
    }
    verifyLinkResult()
    return () => { alive = false }
  }, [loadIdentities, location.hash, location.pathname, location.search, user?.id])

  const disconnectGoogle = async () => {
    if (!googleIdentity || unlinkingGoogle) return
    if (!canUnlinkGoogle) {
      toast.error('Tambahkan dan verifikasi metode login lain sebelum memutus Google.')
      return
    }
    if (!window.confirm(`Putuskan sambungan Google${googleEmail ? ` (${googleEmail})` : ''} dari akun ini?`)) return

    setUnlinkingGoogle(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user || authData.user.id !== user?.id) {
        throw authError || new Error('Sesi akun berubah. Masuk kembali sebelum mencoba lagi.')
      }

      const latestIdentities = await loadIdentities()
      if (!latestIdentities) throw new Error('Status metode login tidak dapat diperiksa.')
      const currentProviders = authData.user.app_metadata?.providers || []
      const hasUsableAlternative = latestIdentities.some((identity) => {
        if (identity.provider === 'google') return false
        if (currentProviders.includes(identity.provider)) return true
        return identity.provider === 'email' && (currentProviders.includes('password') || currentProviders.includes('email'))
      })
      if (!hasUsableAlternative) {
        toast.error('Google adalah satu-satunya metode login yang dapat digunakan. Tambahkan metode lain terlebih dahulu.')
        return
      }
      const currentGoogle = latestIdentities.find((identity) => identity.provider === 'google')
      if (!currentGoogle) {
        toast.success('Akun Google sudah tidak tertaut.')
        return
      }
      const { error } = await supabase.auth.unlinkIdentity(currentGoogle)
      if (error) throw error
      const refreshedIdentities = await loadIdentities()
      if (!refreshedIdentities) throw new Error('Status identitas tidak dapat dimuat ulang.')
      setIdentities(refreshedIdentities)
      toast.success('Sambungan Google berhasil diputus.')
    } catch (error) {
      const detail = (error.message || '').toLowerCase()
      toast.error(detail.includes('identity') || detail.includes('at least 2')
        ? 'Google tidak dapat diputus. Pastikan ada metode login lain yang tetap aktif.'
        : 'Sambungan Google gagal diputus. Periksa koneksi lalu coba lagi.')
    } finally {
      setUnlinkingGoogle(false)
    }
  }

  const connectGoogle = async () => {
    if (!user?.id || linkingGoogle) return
    if (typeof supabase.auth.linkIdentity !== 'function') {
      toast.error('SDK Supabase pada aplikasi belum mendukung penyambungan identitas. Perbarui SDK terlebih dahulu.')
      return
    }
    setLinkingGoogle(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData.user || authData.user.id !== user.id) {
        throw authError || new Error('Sesi login tidak valid. Masuk kembali lalu coba lagi.')
      }
      sessionStorage.setItem('umkm-google-link-user', user.id)
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard/pengaturan-akun?google_link=1` },
      })
      if (error) {
        sessionStorage.removeItem('umkm-google-link-user')
        const detail = error.message.toLowerCase()
        setLinkingGoogle(false)
        if (detail.includes('identity') || detail.includes('already')) {
          toast.error('Akun Google ini sudah tertaut ke akun lain. Tidak ada akun yang digabungkan.')
        } else if (detail.includes('manual linking') || detail.includes('linking is disabled')) {
          toast.error('Penyambungan akun belum diaktifkan pada pengaturan Supabase Auth.')
        } else {
          toast.error('Google belum berhasil disambungkan. Periksa pengaturan OAuth Supabase lalu coba lagi.')
        }
        return
      }
      // Browser akan diarahkan ke Google oleh SDK. Hentikan spinner apabila redirect diblokir.
      window.setTimeout(() => setLinkingGoogle(false), 8000)
    } catch (error) {
      sessionStorage.removeItem('umkm-google-link-user')
      toast.error(`Tidak dapat memulai penyambungan Google: ${error.message}`)
      setLinkingGoogle(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Akun</h1>
        <p className="mt-1 text-sm text-slate-600">Atur keamanan login dan periksa status email akun Anda.</p>
      </header>

      <section className="card overflow-hidden">
        <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <span className="rounded-lg bg-brand-50 p-2 text-brand-700"><KeyRound size={19} /></span>
          <div>
            <h2 className="font-semibold text-slate-900">Ganti password</h2>
            <p className="mt-1 text-sm text-slate-500">Gunakan password yang kuat dan tidak dipakai di akun lain.</p>
          </div>
        </div>
        <form onSubmit={submit} className="max-w-xl space-y-4 p-5 sm:p-6">
          <label className="block">
            <span className="label">Password baru</span>
            <span className="relative block">
              <input className="input pr-11" type={visible ? 'text' : 'password'} autoComplete="new-password" minLength={8} placeholder="Masukkan kata sandi baru" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="button" aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setVisible(!visible)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800">
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
            <span className="mt-1 block text-xs text-slate-500">Minimal 8 karakter.</span>
          </label>
          <label className="block">
            <span className="label">Konfirmasi password baru</span>
            <input className="input" type={visible ? 'text' : 'password'} autoComplete="new-password" minLength={8} placeholder="Ulangi kata sandi baru" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
            {confirmation && password !== confirmation && <span className="mt-1 block text-xs text-red-700">Password belum cocok.</span>}
          </label>
          <button type="submit" disabled={saving || password.length < 8 || password !== confirmation} className="btn-primary min-w-40 justify-center">
            {saving ? 'Menyimpan…' : 'Perbarui password'}
          </button>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700" aria-hidden="true">
            <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 4)"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.73 6C44.42 37.9 46.98 31.8 46.98 24.55Z" transform="translate(0 -1)"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z" transform="translate(1)"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.88 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -3)"/></svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-900">Akun Terhubung</h2>
            <p className="mt-1 text-sm text-slate-500">Hubungkan akun Google untuk memudahkan login ke UMKM Builder.</p>
          </div>
          {!identitiesLoading && (
            <span className={identitiesError ? 'badge-warning shrink-0' : googleIdentity ? 'badge-success shrink-0' : 'badge-neutral shrink-0'}>{identitiesError ? 'Status tidak tersedia' : googleIdentity ? 'Terhubung' : 'Belum terhubung'}</span>
          )}
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {identitiesLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500"><span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" /> Memeriksa akun terhubung…</div>
          ) : (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Google</p>
              <p className="mt-1 break-all text-sm text-slate-600">{googleIdentity ? googleEmail || 'Identitas Google aktif' : 'Hubungkan akun Google untuk login dengan metode yang sama.'}</p>
            </div>
          )}
          {!identitiesLoading && identitiesError && (
            <button type="button" onClick={loadIdentities} className="btn-secondary shrink-0 justify-center">Periksa lagi</button>
          )}
          {!identitiesLoading && !identitiesError && !googleIdentity && (
            <button type="button" onClick={connectGoogle} disabled={linkingGoogle} className="btn-secondary shrink-0 justify-center border-slate-300 px-4">
              {linkingGoogle ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-700" /> : <Link2 size={16} />}
              {linkingGoogle ? 'Menghubungkan…' : 'Sambungkan Google'}
            </button>
          )}
          {!identitiesLoading && !identitiesError && canUnlinkGoogle && (
            <button type="button" onClick={disconnectGoogle} disabled={unlinkingGoogle} className="btn-secondary shrink-0 justify-center border-slate-300 text-red-700 hover:bg-red-50 hover:text-red-800">
              {unlinkingGoogle ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-700" /> : <ExternalLink size={16} />}
              {unlinkingGoogle ? 'Memutuskan…' : 'Putuskan Sambungan'}
            </button>
          )}
          {!identitiesLoading && !identitiesError && googleIdentity && !canUnlinkGoogle && (
            <span className="shrink-0 text-xs text-slate-500">Metode login satu-satunya</span>
          )}
        </div>
        {!identitiesLoading && !identitiesError && googleIdentity && !canUnlinkGoogle && (
          <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs leading-relaxed text-slate-600 sm:px-6">
            Google adalah satu-satunya metode login yang terhubung. Sambungkan metode login lain sebelum memutus Google agar akses akun tetap tersedia.
          </p>
        )}
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <span className="rounded-lg bg-brand-50 p-2 text-brand-700"><MailCheck size={19} /></span>
          <div>
            <h2 className="font-semibold text-slate-900">Email akun</h2>
            <p className="mt-1 text-sm text-slate-500">Email tidak dapat diubah dari halaman ini.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:px-6">
          <div>
            <p className="break-all text-sm font-semibold text-slate-900">{user?.email || '—'}</p>
            <p className="mt-1 text-xs text-slate-500">Untuk mengubah email, diperlukan proses verifikasi melalui Supabase Auth.</p>
          </div>
          <span className={emailVerified ? 'badge-success' : 'badge-warning'}>
            <ShieldCheck size={14} className="mr-1.5" /> {emailVerified ? 'Terverifikasi' : 'Belum terverifikasi'}
          </span>
        </div>
      </section>
    </div>
  )
}
