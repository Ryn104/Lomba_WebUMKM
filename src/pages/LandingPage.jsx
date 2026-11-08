import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Blocks, LayoutDashboard, ReceiptText, Wallet, Globe, MousePointerClick, ArrowRight, Check, ShoppingBag, TrendingUp, Star, LogIn, UserPlus } from "lucide-react";
import Logo from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";
import { PLATFORM_DOMAIN } from "../lib/supabase";
import AccountMenu from "../components/ui/AccountMenu";
import { ThemeIconButton } from "../components/ui/ThemeToggle";

const features = [
  { icon: MousePointerClick, title: "Web Builder Drag & Drop", desc: "Susun Hero, Tentang, Produk, Galeri, Testimoni, dan Kontak dengan seret & lepas. Tanpa coding." },
  { icon: Globe, title: "Alamat Toko Otomatis", desc: `Toko Anda langsung online di ${PLATFORM_DOMAIN}/nama-toko begitu dipublikasikan.` },
  { icon: LayoutDashboard, title: "Dashboard Toko Sendiri", desc: "Kelola produk, kategori, dan diskon. Produk otomatis tampil di website toko." },
  { icon: Wallet, title: "Pencatatan Keuangan", desc: "Catat pemasukan & pengeluaran, lihat laba rugi dan grafik bulanan." },
  { icon: ReceiptText, title: "Kasir (POS) Offline", desc: "Layani penjualan langsung di toko. Stok berkurang & pemasukan tercatat otomatis." },
  { icon: Blocks, title: "Kustomisasi Section", desc: "Atur warna, teks, dan gambar tiap section dengan preview real-time." },
];

const steps = [
  { t: "Daftar & buat toko", d: "Isi nama toko dan dapatkan alamat website Anda sendiri dalam hitungan detik." },
  { t: "Susun website", d: "Tarik & lepas section, lalu atur warna, teks, dan gambar sesuai brand Anda." },
  { t: "Publish & kelola", d: "Satu klik online. Kelola produk, kasir, dan keuangan dari satu dashboard." },
];

const navLinks = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#mulai", label: "Mulai" },
];

/* ---------- Animasi ---------- */

const animationCss = `
@keyframes lp-fade-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes lp-fade-down { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: none; } }
@keyframes lp-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes lp-drift { 0%, 100% { transform: translate(-50%, 0) scale(1); } 50% { transform: translate(-46%, 24px) scale(1.1); } }
@keyframes lp-shine { to { background-position: 200% center; } }
@keyframes lp-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
.lp-blink { animation: lp-blink 1s step-end infinite; }
.lp-fade-up { opacity: 0; animation: lp-fade-up .9s cubic-bezier(.2,.7,.2,1) forwards; }
.lp-fade-down { opacity: 0; animation: lp-fade-down .8s cubic-bezier(.2,.7,.2,1) forwards; }
.lp-float { animation: lp-float 5s ease-in-out infinite; }
.lp-drift { animation: lp-drift 12s ease-in-out infinite; }
.lp-shine { background-size: 200% auto; animation: lp-shine 6s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .lp-fade-up, .lp-fade-down { opacity: 1; animation: none; }
  .lp-float, .lp-drift, .lp-shine, .lp-blink { animation: none; }
}
`;

const heroWords = ["dalam hitungan menit.", "tanpa coding.", "dengan drag & drop.", "lengkap dengan kasir."];

// Efek mengetik -> jeda -> menghapus -> mengetik kata berikutnya (berputar)
function useTypewriter(words, { type = 70, del = 38, hold = 1700, gap = 350 } = {}) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(words[0]);
      return;
    }
    let i = 0;
    let j = 0;
    let deleting = false;
    let timer;
    const tick = () => {
      const word = words[i];
      if (!deleting) {
        j += 1;
        setText(word.slice(0, j));
        if (j === word.length) {
          deleting = true;
          timer = setTimeout(tick, hold);
          return;
        }
        timer = setTimeout(tick, type);
      } else {
        j -= 1;
        setText(word.slice(0, j));
        if (j === 0) {
          deleting = false;
          i = (i + 1) % words.length;
          timer = setTimeout(tick, gap);
          return;
        }
        timer = setTimeout(tick, del);
      }
    };
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
  }, [words, type, del, hold, gap]);
  return text;
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// Elemen muncul halus (fade + geser + skala) saat masuk viewport
function Reveal({ children, delay = 0, y = 28, scale = 1, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : `translateY(${y}px) scale(${scale})`,
        transition: `opacity 700ms ease-out ${delay}ms, transform 800ms cubic-bezier(.2,.7,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Bar progres scroll di bagian paling atas halaman
function ScrollProgress() {
  const barRef = useRef(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={barRef} className="fixed left-0 top-0 z-50 h-[3px] w-full origin-left bg-gradient-to-r from-brand-500 to-sky-400" style={{ transform: "scaleX(0)" }} />;
}

/* ---------- Komponen ---------- */

function Navbar({ user, isAdmin }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-4 sm:pt-4">
      <div
        className={`relative mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full border border-white/10 bg-slate-900/10 py-1.5 pl-3 pr-1.5 backdrop-blur-md transition-all duration-300 sm:py-2 sm:pl-5 sm:pr-2 ${
          scrolled ? "shadow-lg shadow-black/20" : "shadow-sm"
        }`}
      >
        <Link to="/" className="shrink-0 text-slate-900">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-4 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-500/10 hover:text-slate-900">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Link to={isAdmin ? "/admin" : "/dashboard"} className="btn-primary !rounded-full !px-3.5 !py-2 text-sm whitespace-nowrap sm:!px-5">
                <LayoutDashboard size={16} className="shrink-0" />
                <span className="sm:hidden">Dashboard</span>
                <span className="hidden sm:inline">{isAdmin ? "Dashboard Admin" : "Buka Dashboard"}</span>
              </Link>
              <AccountMenu />
            </>
          ) : (
            <>
              <ThemeIconButton />
              <Link to="/login" className="btn-ghost !rounded-full !px-3 !py-2 text-sm whitespace-nowrap sm:!px-4">
                <LogIn size={16} className="shrink-0" />
                Masuk
              </Link>
              <Link to="/register" className="btn-primary !rounded-full !px-3.5 !py-2 text-sm whitespace-nowrap sm:!px-5">
                <UserPlus size={16} className="shrink-0" />
                <span className="sm:hidden">Daftar</span>
                <span className="hidden sm:inline">Daftar Gratis</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroMockup() {
  const tiltRef = useRef(null);

  // Mockup miring ke belakang saat awal, lalu menegak & membesar mengikuti scroll
  useEffect(() => {
    const el = tiltRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const p = Math.min(window.scrollY / 450, 1);
      el.style.transform = `perspective(1400px) rotateX(${(1 - p) * 14}deg) scale(${0.94 + 0.06 * p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="lp-fade-up relative mx-auto mt-16 max-w-3xl" style={{ animationDelay: "650ms" }}>
      <div className="absolute inset-x-10 -bottom-6 -z-10 h-24 rounded-full bg-brand-500/20 blur-3xl" />

      <div ref={tiltRef} style={{ transformOrigin: "center top", willChange: "transform" }}>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl shadow-slate-900/10">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400/50" />
            <div className="ml-3 flex-1 truncate rounded-md border border-slate-500/20 px-3 py-1 font-mono text-xs text-slate-500">
              {PLATFORM_DOMAIN}/<span className="font-bold text-brand-600">kopi-senja</span>
            </div>
          </div>

          <div className="p-5">
            <div className="rounded-xl bg-gradient-to-br from-brand-700 to-brand-500 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Kopi Senja</p>
              <p className="mt-1 text-2xl font-extrabold">Kopi lokal, diseduh sepenuh hati</p>
              <span className="mt-4 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand-800">Lihat Produk</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                ["Arabika Gayo", "Rp 45.000"],
                ["Robusta Lampung", "Rp 35.000"],
                ["Cold Brew", "Rp 28.000"],
              ].map(([n, p], i) => (
                <div
                  key={n}
                  className="lp-fade-up rounded-lg border border-slate-200 p-2.5 transition duration-300 hover:-translate-y-1 hover:shadow-md"
                  style={{ animationDelay: `${1000 + i * 120}ms` }}
                >
                  <div className="flex h-16 items-center justify-center rounded-md bg-slate-500/10">
                    <ShoppingBag size={18} className="text-slate-500" />
                  </div>
                  <p className="mt-2 truncate text-xs font-semibold text-slate-800">{n}</p>
                  <p className="text-xs text-brand-600">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kartu mengambang di luar tepi mockup, bergerak naik-turun perlahan */}
      <div className="absolute left-0 top-20 hidden -translate-x-[88%] lg:block">
        <div className="lp-float rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-brand-500/10 p-2 text-brand-600">
              <TrendingUp size={16} />
            </span>
            <div className="text-left">
              <p className="text-[11px] text-slate-500">Laba bulan ini</p>
              <p className="text-sm font-bold text-slate-900">Rp 4.250.000</p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-16 right-0 hidden translate-x-[88%] lg:block">
        <div className="lp-float rounded-xl border border-slate-200 bg-white p-3 shadow-xl" style={{ animationDelay: "1.5s" }}>
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-brand-500/10 p-2 text-brand-600">
              <Star size={16} />
            </span>
            <div className="text-left">
              <p className="text-[11px] text-slate-500">Pesanan baru</p>
              <p className="text-sm font-bold text-slate-900">+12 hari ini</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ index, title, desc }) {
  const [ref, inView] = useInView(0.3);
  return (
    <li ref={ref} className="pt-0">
      {/* garis yang "menggambar" dirinya saat terlihat */}
      <div className="relative h-px w-full bg-slate-200">
        <span
          className="absolute inset-y-0 left-0 bg-brand-500"
          style={{
            width: inView ? "100%" : "0%",
            transition: `width 1100ms cubic-bezier(.2,.7,.2,1) ${index * 200}ms`,
          }}
        />
      </div>
      <div
        className="pt-6"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "none" : "translateY(20px)",
          transition: `opacity 700ms ease-out ${index * 200 + 150}ms, transform 800ms cubic-bezier(.2,.7,.2,1) ${index * 200 + 150}ms`,
        }}
      >
        <span className="font-mono text-sm font-semibold text-brand-600">0{index + 1}</span>
        <p className="mt-3 text-lg font-semibold text-slate-900">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{desc}</p>
      </div>
    </li>
  );
}

export default function LandingPage() {
  const { user, isAdmin } = useAuth();
  const typed = useTypewriter(heroWords);

  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = "smooth";
    return () => {
      el.style.scrollBehavior = prev;
    };
  }, []);

  return (
    <div className="app-bg min-h-screen bg-[#F8FAFC]">
      <style>{animationCss}</style>
      <ScrollProgress />
      <Navbar user={user} isAdmin={isAdmin} />

      {/* HERO */}
      <section className="relative -mt-[72px] overflow-hidden pt-[72px]">
        <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(148,163,184,0.28)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="lp-drift pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-20 text-center sm:pt-28">
          <span
            className="lp-fade-up inline-flex items-center gap-2 rounded-full border border-slate-500/20 bg-slate-500/10 px-3.5 py-1.5 text-xs font-medium text-slate-600"
            style={{ animationDelay: "150ms" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            Platform website untuk UMKM Indonesia
          </span>

          <h1 className="lp-fade-up mt-7 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.5rem]" style={{ animationDelay: "300ms" }}>
            <span className="block sm:whitespace-nowrap">Bikin website toko UMKM</span>
            <span className="mt-1 block min-h-[1.15em] sm:whitespace-nowrap">
              Anda <span className="lp-shine bg-gradient-to-r from-brand-600 via-sky-400 to-brand-600 bg-clip-text text-transparent">{typed || "\u200b"}</span>
              <span className="lp-blink ml-1 inline-block h-[0.85em] w-[3px] translate-y-[0.1em] rounded-full bg-brand-500" aria-hidden="true" />
            </span>
          </h1>
          <p className="lp-fade-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600" style={{ animationDelay: "450ms" }}>
            Desain dengan drag & drop, tambah produk, atur diskon, catat keuangan, dan jualan offline dengan kasir — semua dalam satu tempat.
          </p>

          <div className="lp-fade-up mt-9 flex flex-wrap justify-center gap-3" style={{ animationDelay: "550ms" }}>
            <Link to="/register" className="btn-primary group px-7 py-3.5 text-base transition hover:-translate-y-0.5">
              Mulai Buat Toko <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link to="/login" className="btn-secondary px-7 py-3.5 text-base transition hover:-translate-y-0.5">
              Saya sudah punya akun
            </Link>
          </div>

          <ul className="lp-fade-up mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500" style={{ animationDelay: "650ms" }}>
            {["Gratis mendaftar", "Tanpa coding", "Siap dalam menit"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check size={15} className="text-brand-500" /> {t}
              </li>
            ))}
          </ul>

          <HeroMockup />
        </div>
      </section>

      {/* FITUR */}
      <section id="fitur" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-brand-600">Fitur</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Semua yang dibutuhkan toko Anda</h2>
          <p className="mt-3 text-slate-600">Dari etalase online sampai kasir dan laporan keuangan, tanpa pindah-pindah aplikasi.</p>
        </Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={(i % 3) * 120} className="h-full">
              <div className="card group h-full p-6 transition duration-300 hover:-translate-y-1.5 hover:border-brand-500/40 hover:shadow-xl">
                <span className="inline-flex rounded-xl bg-brand-500/10 p-3 text-brand-600 transition duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white">
                  <Icon size={22} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CARA KERJA */}
      <section id="cara-kerja" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-24">
        <Reveal className="text-center">
          <p className="text-sm font-semibold text-brand-600">Mudah dimulai</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Cara kerjanya</h2>
        </Reveal>
        <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map(({ t, d }, i) => (
            <Step key={t} index={i} title={t} desc={d} />
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section id="mulai" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-24">
        <Reveal scale={0.96} y={36}>
          <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-b from-brand-500/10 to-transparent px-6 py-16 text-center sm:px-12">
            <div className="lp-drift pointer-events-none absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Siap membawa usaha Anda online?</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-600">Buat toko, tampilkan produk, dan mulai berjualan hari ini.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/register" className="btn-primary group px-7 py-3.5 text-base transition hover:-translate-y-0.5">
                  Daftar Gratis <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link to="/login" className="btn-secondary px-7 py-3.5 text-base transition hover:-translate-y-0.5">
                  Masuk
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div>
              <Link to="/" className="inline-block text-slate-900">
                <Logo />
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
                Platform website untuk UMKM Indonesia. Bangun toko online, kelola produk, kasir, dan keuangan dalam satu tempat.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Jelajahi</p>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="transition hover:text-brand-600">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Akun</p>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                {user ? (
                  <li>
                    <Link to={isAdmin ? "/admin" : "/dashboard"} className="transition hover:text-brand-600">
                      {isAdmin ? "Dashboard Admin" : "Buka Dashboard"}
                    </Link>
                  </li>
                ) : (
                  <>
                    <li>
                      <Link to="/login" className="transition hover:text-brand-600">
                        Masuk
                      </Link>
                    </li>
                    <li>
                      <Link to="/register" className="transition hover:text-brand-600">
                        Daftar Gratis
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
            <p>
              © {new Date().getFullYear()} UMKITA · <span className="font-semibold text-slate-700">Kata Sandi Bebas</span>, RTRW Studio
            </p>
            <p className="font-mono">{PLATFORM_DOMAIN}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
