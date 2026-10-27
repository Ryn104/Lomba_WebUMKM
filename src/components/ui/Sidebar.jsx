import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

/** Layout dashboard dengan sidebar — dipakai Admin & Dashboard Toko */
export default function DashboardLayout({ title, subtitle, links, children, headerRight, sidebarWidget }) {
  const { profile, signOut } = useAuth()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)

  const logout = async () => {
    await signOut()
    nav('/')
  }

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-slate-300">
      <div className="px-5 py-5">
        <p className="text-lg font-extrabold text-white">{title}</p>
        {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
      </div>
      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
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

      <div className="border-t border-slate-800 p-4">
        <p className="truncate text-sm font-semibold text-white">{profile?.full_name || 'Pengguna'}</p>
        <p className="truncate text-xs text-slate-400">{profile?.email}</p>
        <button onClick={logout} className="mt-3 flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <LogOut size={16} /> Keluar
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative">{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
          <button className="rounded p-1 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(!open)}>
            {open ? <X /> : <Menu />}
          </button>
          <div className="flex-1" />
          {headerRight}
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
