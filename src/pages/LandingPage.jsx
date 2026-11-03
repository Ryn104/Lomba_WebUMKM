import { Link } from 'react-router-dom'
import { Blocks, LayoutDashboard, ReceiptText, Wallet, Globe, MousePointerClick, ArrowRight, Check } from 'lucide-react'
import Logo from '../components/ui/Logo'
import { useAuth } from '../context/AuthContext'
import { PLATFORM_DOMAIN } from '../lib/supabase'

const features = [
  { icon: MousePointerClick, title: 'Web Builder Drag & Drop', desc: 'Susun Hero, Tentang, Produk, Galeri, Testimoni, dan Kontak dengan seret & lepas. Tanpa coding.' },
  { icon: Globe, title: 'Alamat Toko Otomatis', desc: `Toko Anda langsung online di ${PLATFORM_DOMAIN}/nama-toko begitu dipublikasikan.` },
  { icon: LayoutDashboard, title: 'Dashboard Toko Sendiri', desc: 'Kelola produk, kategori, dan diskon. Produk otomatis tampil di website toko.' },
  { icon: Wallet, title: 'Pencatatan Keuangan', desc: 'Catat pemasukan & pengeluaran, lihat laba rugi dan grafik bulanan.' },
  { icon: ReceiptText, title: 'Kasir (POS) Offline', desc: 'Layani penjualan langsung di toko. Stok berkurang & pemasukan tercatat otomatis.' },
  { icon: Blocks, title: 'Kustomisasi Section', desc: 'Atur warna, teks, dan gambar tiap section dengan preview real-time.' },
]

export default function LandingPage() {
  const { user, isAdmin } = useAuth()
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-slate-900"><Logo /></Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                {isAdmin && <Link to="/admin" className="btn-ghost">Admin</Link>}
                <Link to="/dashboard" className="btn-primary">Buka Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Masuk</Link>
                <Link to="/register" className="btn-primary">Daftar Gratis</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-200/80 bg-gradient-to-b from-brand-50/70 via-slate-50 to-[#F8FAFC]">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1 text-xs font-semibold text-brand-800">
            Platform website untuk UMKM Indonesia
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl">
            Bikin website toko UMKM Anda <span className="text-brand-700">dalam hitungan menit</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Desain dengan drag & drop, tambah produk, atur diskon, catat keuangan, dan jualan offline dengan kasir — semua dalam satu tempat.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-primary px-6 py-3 text-base">
              Mulai Buat Toko <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary px-6 py-3 text-base">Saya sudah punya akun</Link>
          </div>
          <div className="mx-auto mt-10 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-mono text-sm text-slate-600 shadow-sm">
            <Globe size={16} className="text-brand-700" />
            {PLATFORM_DOMAIN}/<span className="font-bold text-brand-700">toko-anda</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-bold text-slate-900">Semua yang dibutuhkan toko Anda</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-6 transition hover:shadow-md">
              <span className="inline-flex rounded-lg bg-brand-50 p-3 text-brand-700"><Icon size={22} /></span>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-3xl font-bold text-white">Cara kerjanya</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {['Daftar & buat toko', 'Susun website dengan drag & drop', 'Publish & kelola dari dashboard'].map((t, i) => (
              <li key={t} className="rounded-xl border border-slate-800 bg-slate-800/80 p-6 text-slate-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 font-bold text-white shadow-sm">{i + 1}</span>
                <p className="mt-3 font-semibold text-white">{t}</p>
              </li>
            ))}
          </ol>
          <ul className="mx-auto mt-10 grid max-w-xl gap-2 text-sm text-slate-300">
            {['Tanpa coding', 'Produk tampil otomatis di website', 'Responsif di HP & desktop'].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check size={16} className="text-brand-400" /> {t}</li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} RTRW Studio — UMKM Web Builder
      </footer>
    </div>
  )
}
