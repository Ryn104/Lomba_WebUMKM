import { NavLink, useNavigate, Link } from 'react-router-dom'
import { LogOut, Menu, X, UserRound, Settings2, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

/** Layout dashboard dengan sidebar — dipakai Admin & Dashboard Toko */
export default function DashboardLayout({ title, subtitle, links, children, headerRight, sidebarWidget }) {
  const { profile, user, signOut, unsavedChanges } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!accountOpen) return undefined
    const closeOnOutsideClick = (event) => {
      if (!event.target.closest('[data-sidebar-account-menu]')) setAccountOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setAccountOpen(false)
    }
    document.addEventListener('click', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('click', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountOpen])

  const logout = async () => {
    if (loggingOut) return
    if (unsavedChanges && !window.confirm('Perubahan profil belum disimpan. Tetap keluar dan buang perubahan?')) return
    setLoggingOut(true)
    const { error } = await signOut()
    setLoggingOut(false)
    if (error) return toast.error(`Tidak dapat keluar: ${error.message}`)
    nav('/login', { replace: true })
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Pengguna'
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture


  const sidebar = (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-slate-900 text-slate-300">
      <div className="px-5 py-5">
        <p className="text-lg font-extrabold text-white">{title}</p>
        {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
      </div>
      <nav className="hide-scrollbar min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-brand-700 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>

      {/* Subscription widget di bagian bawah sidebar jika ada */}
      {sidebarWidget}

      <div className="relative border-t border-slate-800 p-3" data-sidebar-account-menu>
        {accountOpen && (
          <div className="absolute bottom-full left-3 right-3 z-30 mb-2 max-h-[min(16rem,40vh)] overflow-y-auto rounded-lg hide-scrollbar border border-slate-700 bg-slate-800 py-1 shadow-xl">
            <Link to="/dashboard/profil" onClick={() => { setAccountOpen(false); setOpen(false) }} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white">
              <UserRound size={16} /> Profil Saya
            </Link>
            <Link to="/dashboard/pengaturan-akun" onClick={() => { setAccountOpen(false); setOpen(false) }} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white">
              <Settings2 size={16} /> Pengaturan Akun
            </Link>
            <button type="button" disabled={loggingOut} onClick={logout} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-60">
              <LogOut size={16} /> {loggingOut ? 'Keluar…' : 'Keluar'}
            </button>
          </div>
        )}
        <button type="button" aria-expanded={accountOpen} aria-haspopup="menu" onClick={() => setAccountOpen(!accountOpen)} className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-slate-800">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full bg-slate-700 object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">{displayName.trim().charAt(0).toUpperCase()}</span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{displayName}</span>
            <span className="block truncate text-xs text-slate-400">{user?.email || profile?.email}</span>
          </span>
          <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      <div className="hidden lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative h-full">{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className={`flex min-h-14 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-8 ${headerRight ? '' : 'lg:hidden'}`}>
          <button className="rounded p-1 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Tutup navigasi' : 'Buka navigasi'}>
            {open ? <X /> : <Menu />}
          </button>
          {headerRight && <div className="ml-auto">{headerRight}</div>}
        </header>
        <main data-dashboard-scroll className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
