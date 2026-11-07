import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LayoutDashboard, LogOut, Settings2, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { ThemeSegmented } from './ThemeToggle'
import Avatar from './Avatar'

/** Menu akun untuk header landing page: profil, pengaturan akun, tema, dan keluar */
export default function AccountMenu() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onOutside = (event) => {
      if (!event.target.closest('[data-account-menu]')) setOpen(false)
    }
    const onEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', onOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('click', onOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  const base = isAdmin ? '/admin' : '/dashboard'
  const name = profile?.full_name || user?.user_metadata?.full_name || 'Pengguna'
  const email = user?.email || profile?.email
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  const logout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    const { error } = await signOut()
    setLoggingOut(false)
    if (error) return toast.error(`Tidak dapat keluar: ${error.message}`)
    setOpen(false)
  }

  const itemClass = 'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50'

  return (
    <div className="relative" data-account-menu>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 shadow-sm transition hover:bg-slate-50"
      >
        <Avatar name={name} src={avatarUrl || ''} className="h-8 w-8 text-sm" />
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-slate-700 sm:block">{name}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="card absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <Avatar name={name} src={avatarUrl || ''} className="h-10 w-10 text-base" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
              <p className="truncate text-xs text-slate-500">{email}</p>
            </div>
            {isAdmin && <span className="badge-info shrink-0">Admin</span>}
          </div>

          <div className="py-1">
            <Link to={base} onClick={() => setOpen(false)} className={itemClass}><LayoutDashboard size={16} /> {isAdmin ? 'Dashboard Admin' : 'Dashboard Toko'}</Link>
            <Link to={`${base}/profil`} onClick={() => setOpen(false)} className={itemClass}><UserRound size={16} /> Profil Saya</Link>
            <Link to={`${base}/pengaturan`} onClick={() => setOpen(false)} className={itemClass}><Settings2 size={16} /> Pengaturan Akun</Link>
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tampilan</p>
            <ThemeSegmented />
          </div>

          <div className="border-t border-slate-100 py-1">
            <button type="button" disabled={loggingOut} onClick={logout} className={`${itemClass} text-red-600 hover:bg-red-50 disabled:opacity-60`}>
              <LogOut size={16} /> {loggingOut ? 'Keluar…' : 'Keluar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}