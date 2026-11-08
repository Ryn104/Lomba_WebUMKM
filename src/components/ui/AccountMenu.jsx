import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LayoutDashboard, LogOut, Settings2, UserRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { ThemeSegmented } from './ThemeToggle'
import Avatar from './Avatar'

const menuCss = `
@keyframes am-pop { from { opacity: 0; transform: translateY(-8px) scale(.97); } to { opacity: 1; transform: none; } }
.am-pop { animation: am-pop .2s cubic-bezier(.2,.7,.2,1) both; transform-origin: top right; }
@media (prefers-reduced-motion: reduce) { .am-pop { animation: none; } }
`

/** Ikon kecil dalam tile hijau (atau merah untuk aksi berbahaya) di samping tiap menu */
function MenuIcon({ icon: Icon, danger = false }) {
  return (
    <span className={`rounded-lg p-1.5 transition-transform duration-200 group-hover:scale-110 ${danger ? 'bg-red-500/10 text-red-600' : 'bg-brand-500/10 text-brand-600'}`}>
      <Icon size={15} />
    </span>
  )
}

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

  const itemClass = 'group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-500/10 hover:text-slate-900'

  return (
    <div className="relative" data-account-menu>
      <style>{menuCss}</style>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-slate-500/20 bg-slate-500/10 py-1 pl-1 pr-2.5 transition hover:border-brand-500/40 hover:bg-slate-500/15"
      >
        <Avatar name={name} src={avatarUrl || ''} className="h-8 w-8 text-sm" />
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-slate-700 sm:block">{name}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="card am-pop absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden !rounded-2xl shadow-2xl">
          {/* Kepala menu: identitas akun dengan cahaya hijau lembut */}
          <div className="relative flex items-center gap-3 border-b border-slate-100 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent px-4 py-3.5">
            <Avatar name={name} src={avatarUrl || ''} className="h-11 w-11 text-base" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
              <p className="truncate text-xs text-slate-500">{email}</p>
            </div>
            {isAdmin && <span className="badge-info shrink-0">Admin</span>}
          </div>

          <div className="space-y-0.5 p-1.5">
            <Link to={base} onClick={() => setOpen(false)} className={itemClass}>
              <MenuIcon icon={LayoutDashboard} /> {isAdmin ? 'Dashboard Admin' : 'Dashboard Toko'}
            </Link>
            <Link to={`${base}/profil`} onClick={() => setOpen(false)} className={itemClass}>
              <MenuIcon icon={UserRound} /> Profil Saya
            </Link>
            <Link to={`${base}/pengaturan`} onClick={() => setOpen(false)} className={itemClass}>
              <MenuIcon icon={Settings2} /> Pengaturan Akun
            </Link>
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tampilan</p>
            <ThemeSegmented />
          </div>

          <div className="border-t border-slate-100 p-1.5">
            <button
              type="button"
              disabled={loggingOut}
              onClick={logout}
              className={`${itemClass} !text-red-600 hover:!bg-red-500/10 disabled:opacity-60`}
            >
              <MenuIcon icon={LogOut} danger /> {loggingOut ? 'Keluar…' : 'Keluar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}