import { useEffect, useRef, useState } from 'react'
import { CircleUserRound, ImagePlus, RotateCcw, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui/Field'
import { supabase, BUCKET } from '../lib/supabase'
import { formatDate } from '../lib/utils'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024
export default function AccountProfilePage() {
  const { user, profile, refreshProfile, setUnsavedChanges } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarPath, setAvatarPath] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [savedValues, setSavedValues] = useState({ name: '', phone: '', avatarPath: '' })
  const fileInputRef = useRef(null)
  const dirty = Boolean(user && (name !== savedValues.name || phone !== savedValues.phone || avatarFile))

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      if (!alive) return
      if (error) {
        toast.error(`Profil tidak dapat dimuat: ${error.message}`)
      } else {
        const fresh = data || profile || {}
        const currentName = fresh.full_name || user.user_metadata?.full_name || ''
        const currentPhone = fresh.phone || ''
        const path = fresh.avatar_path || ''
        setName(currentName)
        setPhone(currentPhone)
        setAvatarPath(path)
        setSavedValues({ name: currentName, phone: currentPhone, avatarPath: path })
        const profileAvatar = fresh.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
        setAvatarUrl(path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : profileAvatar)
      }
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [user.id])

  useEffect(() => {
    setUnsavedChanges?.(dirty)
    const warnBeforeUnload = (event) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    const confirmInternalNavigation = (event) => {
      if (!dirty || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      if (event.target.closest?.('button, [role="button"]')) return
      const anchor = event.target.closest?.('a[href]')
      if (!anchor || anchor.target === '_blank') return
      const destination = new URL(anchor.href, window.location.href)
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return
      if (!window.confirm('Perubahan profil belum disimpan. Tinggalkan halaman dan buang perubahan?')) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    document.addEventListener('click', confirmInternalNavigation, true)
    return () => {
      setUnsavedChanges?.(false)
      window.removeEventListener('beforeunload', warnBeforeUnload)
      document.removeEventListener('click', confirmInternalNavigation, true)
    }
  }, [dirty, setUnsavedChanges])

  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl('')
      return undefined
    }
    const url = URL.createObjectURL(avatarFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  const updateAvatar = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_AVATAR_BYTES) return toast.error('Ukuran foto maksimal 5 MB.')
    const isSupportedImage = async () => {
      const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
        && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
      if (isJpeg) return 'image/jpeg'
      if (isPng) return 'image/png'
      if (isWebp) return 'image/webp'
      return null
    }
    isSupportedImage().then((contentType) => {
      if (!contentType) return toast.error('File bukan gambar JPEG, PNG, atau WebP yang valid.')
      setAvatarFile(new File([file], file.name, { type: contentType, lastModified: file.lastModified }))
    }).catch(() => toast.error('File gambar tidak dapat dibaca.'))
  }

  const cancelChanges = () => {
    setName(savedValues.name)
    setPhone(savedValues.phone)
    setAvatarPath(savedValues.avatarPath)
    setAvatarFile(null)
  }

  const submit = async (event) => {
    event.preventDefault()
    const cleanName = name.trim()
    const cleanPhone = phone.trim()
    if (cleanName.length < 2 || cleanName.length > 80) return toast.error('Nama harus terdiri dari 2–80 karakter.')
    if (cleanPhone && !/^\+?[0-9\s()-]{8,20}$/.test(cleanPhone)) return toast.error('Format nomor telepon tidak valid.')
    if (!user?.id) return toast.error('Sesi login tidak ditemukan. Silakan masuk kembali.')

    setSaving(true)
    let uploadedPath = ''
    try {
      let nextPath = avatarPath
      let nextUrl = avatarUrl
      if (avatarFile) {
        const extension = avatarFile.type === 'image/png' ? 'png' : avatarFile.type === 'image/webp' ? 'webp' : 'jpg'
        uploadedPath = `avatars/${user.id}/avatar-${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(uploadedPath, avatarFile, {
          contentType: avatarFile.type,
          cacheControl: '3600',
          upsert: false,
        })
        if (uploadError) throw uploadError
        nextPath = uploadedPath
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(nextPath)
        nextUrl = `${data.publicUrl}?v=${Date.now()}`
      }

      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: cleanName, phone: cleanPhone || null, avatar_path: nextPath || null, avatar_url: nextUrl || null })
        .eq('id', user.id)
        .select('id')
        .single()
      if (profileError) throw profileError
      if (!updatedProfile) throw new Error('Profil akun tidak ditemukan.')

      const oldPath = avatarPath
      setName(cleanName)
      setPhone(cleanPhone)
      setAvatarPath(nextPath || '')
      setSavedValues({ name: cleanName, phone: cleanPhone, avatarPath: nextPath || '' })
      setAvatarUrl(nextUrl || '')
      setAvatarFile(null)
      await refreshProfile()
      if (oldPath && uploadedPath && oldPath !== uploadedPath) {
        const { error: removeError } = await supabase.storage.from(BUCKET).remove([oldPath])
        if (removeError) toast.error('Profil tersimpan, tetapi foto lama gagal dihapus dari Storage.')
      }
      toast.success('Profil berhasil diperbarui.')
    } catch (error) {
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([uploadedPath])
        if (cleanupError) console.error('Failed to clean up unreferenced profile avatar', cleanupError)
      }
      toast.error(`Profil gagal disimpan: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  const currentAvatar = previewUrl || avatarUrl
  const displayName = name.trim() || user?.email || 'Pengguna'
  const roleLabel = profile?.role === 'admin' ? 'Admin' : 'UMKM'
  const joinedAt = profile?.created_at || user?.created_at

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
        <p className="mt-1 text-sm text-slate-600">Kelola informasi yang digunakan untuk mengenali akun Anda.</p>
      </header>

      <form onSubmit={submit} className="space-y-6">
        <section className="card overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="font-semibold text-slate-900">Informasi profil</h2>
            <p className="mt-1 text-sm text-slate-500">Informasi ini hanya berlaku untuk akun Anda.</p>
          </div>
          <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-slate-400">
                {currentAvatar ? <img src={currentAvatar} alt={`Foto profil ${displayName}`} onError={() => setAvatarUrl('')} className="h-full w-full object-cover" /> : <CircleUserRound size={64} strokeWidth={1.25} />}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={updateAvatar} className="sr-only" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary px-3 py-2 text-xs">
                <ImagePlus size={15} /> Pilih foto
              </button>
              <p className="text-center text-xs text-slate-500">JPEG, PNG, atau WebP · maks. 5 MB</p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="label">Nama lengkap</span>
                <input className="input" autoComplete="name" maxLength={80} placeholder="Masukkan nama lengkap" value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
              <label className="block">
                <span className="label">Nomor telepon</span>
                <input className="input" type="tel" autoComplete="tel" inputMode="tel" maxLength={20} placeholder="Contoh: 081234567890" value={phone} onChange={(event) => setPhone(event.target.value)} />
                <span className="mt-1 block text-xs text-slate-500">Opsional. Digunakan sebagai kontak akun, bukan kontak publik toko.</span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="label">Email akun</span>
                  <p className="break-all text-sm font-medium text-slate-800">{user?.email || '—'}</p>
                </div>
                <div>
                  <span className="label">Peran</span>
                  <p><span className="badge-neutral">{roleLabel}</span></p>
                </div>
              </div>
              {joinedAt && <p className="text-xs text-slate-500">Bergabung sejak {formatDate(joinedAt)}</p>}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
            <button type="button" disabled={!dirty || saving} onClick={cancelChanges} className="btn-secondary"><RotateCcw size={16} /> Batal</button>
            <button type="submit" disabled={!dirty || saving} className="btn-primary min-w-40 justify-center">
              {saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Menyimpan…</> : <><Save size={16} /> Simpan Perubahan</>}
            </button>
          </div>
        </section>
      </form>


    </div>
  )
}
