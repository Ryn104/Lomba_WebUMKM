import { NavLink, useNavigate, Link } from "react-router-dom";
import { LogOut, Menu, X, UserRound, Settings2, ChevronDown, Clock } from "lucide-react";
import logo from "/logo2.png";
import logoWordmark from "/logo3.png";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Avatar from "./Avatar";

/** Layout dashboard dengan sidebar (desktop) dan dock bawah (mobile) — dipakai Admin & Dashboard Toko */

// Warna sidebar untuk tema terang & gelap.
// Memakai warna hex eksplisit agar tidak ikut ditimpa penyesuaian kelas slate pada tema gelap.
const THEMES = {
  dark: {
    aside: "bg-[#0B1220] border-r border-[#1E293B] text-[#CBD5E1]",
    title: "text-white",
    chip: "border-[#334155] bg-[#1E293B]/70 text-[#94A3B8]",
    label: "text-[#64748B]",
    item: "text-[#CBD5E1] hover:bg-[#1E293B] hover:text-white",
    divider: "border-[#1E293B]",
    account: "border-[#1E293B] bg-[#111A2E] hover:border-[#334155] hover:bg-[#162036]",
    name: "text-white",
    email: "text-[#94A3B8]",
    chevron: "text-[#94A3B8]",
    menu: "border-[#334155] bg-[#1E293B] shadow-black/40",
    menuItem: "text-[#E2E8F0] hover:bg-[#334155] hover:text-white",
    danger: "!text-[#F87171] hover:!bg-[#F87171]/10",
    glow: "bg-brand-500/25",
    dots: "rgba(148,163,184,0.14)",
    wordmarkFilter: "brightness(1.3) saturate(1.1)",
    dockFill: "bg-[#0F1A2E]/85",
    dockIdle: "text-[#B4BFCE]",
    dockBorder: "text-white/15",
    sheet: "border-white/10 bg-[#0B1220]/70 shadow-black/60",
    grip: "bg-white/25",
    tile: "border-white/10 bg-white/[0.06] text-[#CBD5E1]",
    glassCard: "border-white/10 bg-white/[0.06]",
  },
  light: {
    aside: "bg-white border-r border-[#E2E8F0] text-[#475569]",
    title: "text-[#0F172A]",
    chip: "border-[#E2E8F0] bg-[#F1F5F9] text-[#64748B]",
    label: "text-[#94A3B8]",
    item: "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]",
    divider: "border-[#E2E8F0]",
    account: "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1] hover:bg-[#F1F5F9]",
    name: "text-[#0F172A]",
    email: "text-[#64748B]",
    chevron: "text-[#64748B]",
    menu: "border-[#E2E8F0] bg-white shadow-slate-900/10",
    menuItem: "text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A]",
    danger: "!text-[#DC2626] hover:!bg-[#DC2626]/10",
    glow: "bg-brand-500/15",
    dots: "rgba(100,116,139,0.20)",
    wordmarkFilter: "none",
    dockFill: "bg-white/75",
    dockIdle: "text-[#64748B]",
    dockBorder: "text-slate-900/10",
    sheet: "border-white/70 bg-white/65 shadow-slate-900/20",
    grip: "bg-slate-400/50",
    tile: "border-white/70 bg-white/55 text-[#475569]",
    glassCard: "border-white/70 bg-white/50",
  },
};

const NavLinkItem = ({ to, label, icon: Icon, end, onClick, t, index = 0 }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    style={{ animationDelay: `${index * 45}ms` }}
    className={({ isActive }) =>
      `sb-in group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
        isActive
          ? "bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-md shadow-brand-700/25"
          : `${t.item} hover:translate-x-0.5`
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {isActive && <span className="sb-dot h-1.5 w-1.5 shrink-0 rounded-full bg-white/90" />}
      </>
    )}
  </NavLink>
);

// Item dock bawah (mobile): hanya ikon, aktif = kotak membulat hijau lembut dengan ikon hijau
const DockItem = ({ to, label, icon: Icon, end, onClick, t }) => (
  <NavLink to={to} end={end} onClick={onClick} aria-label={label} title={label} className="group flex min-w-0 flex-1 items-center justify-center">
    {({ isActive }) => (
      <span
        className={`flex h-10 w-12 items-center justify-center rounded-xl transition-all duration-300 group-active:scale-90 ${
          isActive ? "sb-dock bg-brand-500/15 text-brand-500" : t.dockIdle
        }`}
      >
        <Icon size={20} />
      </span>
    )}
  </NavLink>
);

// Bentuk dock: bar penuh dengan lekukan setengah lingkaran di tengah (untuk tombol menu).
// Sisi kiri/kanan melebar mengikuti layar, bagian tengah (lekukan) berukuran tetap 120x64px.
const NOTCH_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 64'%3E%3Cpath d='M0 0H11Q23 0 23 13A37 37 0 0 0 97 13Q97 0 109 0H120V64H0Z'/%3E%3C/svg%3E\")";
const DOCK_MASK_IMAGE = `linear-gradient(#000,#000), linear-gradient(#000,#000), ${NOTCH_SVG}`;
const DOCK_MASK_SIZE = "calc(50% - 59px) 100%, calc(50% - 59px) 100%, 120px 64px";
const DOCK_MASK_POSITION = "left top, right top, center top";
const DOCK_MASK_STYLE = {
  maskImage: DOCK_MASK_IMAGE,
  WebkitMaskImage: DOCK_MASK_IMAGE,
  maskSize: DOCK_MASK_SIZE,
  WebkitMaskSize: DOCK_MASK_SIZE,
  maskPosition: DOCK_MASK_POSITION,
  WebkitMaskPosition: DOCK_MASK_POSITION,
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
};

// Tile menu di bottom sheet (mobile)
const SheetTile = ({ to, label, icon: Icon, end, onClick, t }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `sb-tile flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-xs font-medium transition active:scale-95 ${
        isActive ? "border-transparent bg-gradient-to-br from-brand-700 to-brand-500 text-white shadow-md shadow-brand-700/25" : t.tile
      }`
    }
  >
    <Icon size={20} className="shrink-0" />
    <span className="w-full truncate">{label}</span>
  </NavLink>
);

// Ikon menu akun: tile hijau kecil (merah untuk aksi keluar)
const MenuIcon = ({ icon: Icon, danger = false }) => (
  <span className={`rounded-lg p-1.5 transition-transform duration-200 group-hover:scale-110 ${danger ? "bg-red-500/10 text-red-500" : "bg-brand-500/10 text-brand-500"}`}>
    <Icon size={15} />
  </span>
);

// Animasi kecil: menu muncul bergeser dari kiri (tanpa fill akhir, jadi efek hover tetap jalan),
// popup akun, serta bottom sheet & backdrop untuk mobile
const layoutCss = `
@keyframes sb-in { from { opacity: 0; transform: translateX(-10px); } }
@keyframes sb-pop { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
.sb-in { animation: sb-in .45s cubic-bezier(.2,.7,.2,1) backwards; }
.sb-pop { animation: sb-pop .18s ease-out both; }
@keyframes sb-dot { from { opacity: 0; transform: scale(.2); } to { opacity: 1; transform: none; } }
@keyframes sb-dock { from { opacity: 0; transform: translateY(6px) scale(.85); } to { opacity: 1; transform: none; } }
@keyframes sb-tile { from { opacity: 0; transform: translateY(10px) scale(.97); } to { opacity: 1; transform: none; } }
.sb-dot { animation: sb-dot .35s cubic-bezier(.34,1.56,.64,1) both; }
.sb-dock { animation: sb-dock .3s cubic-bezier(.34,1.56,.64,1) both; }
.sb-tile { animation: sb-tile .32s cubic-bezier(.2,.7,.2,1) both; }
@media (prefers-reduced-motion: reduce) { .sb-in, .sb-pop, .sb-dot, .sb-dock, .sb-tile { animation: none; } }
`;

// Jam digital (WIB) yang berdetak tiap detik. Dipisah jadi komponen sendiri agar
// hanya jam yang dirender ulang, bukan seluruh layout.
const clockFormat = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta",
});

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  // Format id-ID memakai titik (13.57.02) -> ganti titik dua
  const time = clockFormat.format(now).replace(/\./g, ":");
  return (
    <span
      className="hidden items-center gap-2 whitespace-nowrap rounded-full border border-slate-500/20 bg-slate-500/10 px-3.5 py-1.5 text-xs font-semibold tabular-nums text-slate-700 md:inline-flex"
      role="timer"
      aria-label={`Pukul ${time} WIB`}
    >
      <Clock size={14} className="text-brand-600" />
      {time}
      <span className="font-medium text-slate-400">WIB</span>
    </span>
  );
}

// Wordmark "UMKITA" dipotong dari aset logo3 yang sama persis dengan halaman login.
// Koordinat crop dalam pixel sumber (logo3.png berukuran 1986x792), tanpa tagline kecil.
const WORDMARK = { x: 667, y: 250, w: 1236, h: 240, imgH: 792, hPx: 24 };

export default function DashboardLayout({ title, subtitle, links, specialLinks = [], children, headerRight, sidebarWidget }) {
  const { profile, user, signOut, unsavedChanges, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const t = isDark ? THEMES.dark : THEMES.light;
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  // open = sheet terpasang di DOM, shown = sheet sedang di posisi tampil (dipakai untuk transisi masuk/keluar)
  const [shown, setShown] = useState(false);
  const closeTimer = useRef(null);

  const openSheet = () => {
    clearTimeout(closeTimer.current);
    if (open) setShown(true);
    else setOpen(true);
  };
  // Tutup: geser turun dulu, lepas dari DOM setelah transisi selesai
  const closeSheet = () => {
    if (!open || !shown) return;
    setShown(false);
    closeTimer.current = setTimeout(() => setOpen(false), 360);
  };
  // Saat baru terpasang, tunggu sebentar agar posisi awal (di bawah layar) sempat dirender, lalu geser naik
  useEffect(() => {
    if (!open) return undefined;
    const id = setTimeout(() => setShown(true), 30);
    return () => clearTimeout(id);
  }, [open]);
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!accountOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!event.target.closest("[data-sidebar-account-menu]")) setAccountOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("click", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("click", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountOpen]);

  // Tutup bottom sheet dengan tombol Escape
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") closeSheet();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, shown]);

  const logout = async () => {
    if (loggingOut) return;
    if (unsavedChanges && !window.confirm("Perubahan profil belum disimpan. Tetap keluar dan buang perubahan?")) return;
    setLoggingOut(true);
    const { error } = await signOut();
    setLoggingOut(false);
    if (error) return toast.error(`Tidak dapat keluar: ${error.message}`);
    nav("/login", { replace: true });
  };
  const accountBase = isAdmin ? "/admin" : "/dashboard";
  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Pengguna";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  // Info untuk header: sapaan sesuai jam dan tanggal hari ini
  const firstName = displayName.split(" ")[0];
  const { greeting, today } = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const g = h < 11 ? "pagi" : h < 15 ? "siang" : h < 18 ? "sore" : "malam";
    const d = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
    return { greeting: g, today: d };
  }, []);

  const dotMask = "linear-gradient(to bottom, black, transparent)";

  // 4 menu utama untuk dock bawah (mobile); sisanya ada di bottom sheet
  const dockLinks = links.slice(0, 4);

  const sidebar = (
    <aside className={`relative isolate flex h-full w-64 shrink-0 flex-col overflow-hidden transition-colors duration-300 ${t.aside}`}>
      {/* Dekorasi bagian atas: pola titik tipis + cahaya hijau lembut, seperti hero landing page */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44"
        style={{
          backgroundImage: `radial-gradient(${t.dots} 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
          maskImage: dotMask,
          WebkitMaskImage: dotMask,
        }}
      />
      <div className={`pointer-events-none absolute -top-24 left-1/2 -z-10 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl ${t.glow}`} />

      <div className="px-5 pb-4 pt-5">
        <div className="mb-4 flex items-center gap-2.5">
          <img src={logo} alt="Logo UMKITA - Web Builder untuk UMKM" className="h-10 w-auto shrink-0 object-contain" />
          <span className="relative inline-block shrink-0 overflow-hidden" style={{ height: WORDMARK.hPx, width: WORDMARK.w * (WORDMARK.hPx / WORDMARK.h) }} aria-hidden="true">
            <img
              src={logoWordmark}
              alt=""
              className="absolute max-w-none"
              style={{
                height: WORDMARK.imgH * (WORDMARK.hPx / WORDMARK.h),
                left: -WORDMARK.x * (WORDMARK.hPx / WORDMARK.h),
                top: -WORDMARK.y * (WORDMARK.hPx / WORDMARK.h),
                filter: t.wordmarkFilter,
              }}
            />
          </span>
        </div>
        <p className={`text-lg font-extrabold tracking-tight ${t.title}`}>{title}</p>
        {subtitle && (
          <p className={`mt-1.5 block w-fit max-w-full truncate rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${t.chip}`}>
            {subtitle}
          </p>
        )}
      </div>

      <nav className="hide-scrollbar min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto overscroll-contain px-3 pb-2">
        <p className={`px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest ${t.label}`}>Menu</p>
        {links.map(({ to, label, icon: Icon, end }, i) => (
          <NavLinkItem key={to} to={to} label={label} icon={Icon} end={end} t={t} index={i} onClick={closeSheet} />
        ))}

        {/* Section fitur khusus — halaman dengan layout sendiri (mis. /pos, /builder) */}
        {specialLinks.length > 0 && (
          <div className={`!mt-3 border-t pt-3 ${t.divider}`}>
            <p className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest ${t.label}`}>Fitur Khusus</p>
            <div className="space-y-1">
              {specialLinks.map(({ to, label, icon: Icon, end }, i) => (
                <NavLinkItem key={to} to={to} label={label} icon={Icon} end={end} t={t} index={links.length + i} onClick={closeSheet} />
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Subscription widget di bagian bawah sidebar jika ada */}
      {sidebarWidget}

      <div className={`relative border-t p-3 ${t.divider}`} data-sidebar-account-menu>
        {accountOpen && (
          <div className={`sb-pop hide-scrollbar absolute bottom-full left-3 right-3 z-30 mb-2 max-h-[min(26rem,70vh)] overflow-y-auto rounded-2xl border p-1.5 shadow-2xl ${t.menu}`}>
            <p className={`px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-widest ${t.label}`}>Akun</p>
            <Link
              to={`${accountBase}/profil`}
              onClick={() => {
                setAccountOpen(false);
                closeSheet();
              }}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${t.menuItem}`}
            >
              <MenuIcon icon={UserRound} /> Profil Saya
            </Link>
            <Link
              to={`${accountBase}/pengaturan`}
              onClick={() => {
                setAccountOpen(false);
                closeSheet();
              }}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${t.menuItem}`}
            >
              <MenuIcon icon={Settings2} /> Pengaturan
            </Link>
            <div className={`my-1 border-t ${t.divider}`} />
            <button
              type="button"
              disabled={loggingOut}
              onClick={logout}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition disabled:opacity-60 ${t.menuItem} ${t.danger}`}
            >
              <MenuIcon icon={LogOut} danger /> {loggingOut ? "Keluar…" : "Keluar"}
            </button>
          </div>
        )}
        <button
          type="button"
          aria-expanded={accountOpen}
          aria-haspopup="menu"
          onClick={() => setAccountOpen(!accountOpen)}
          className={`flex w-full items-center gap-2.5 rounded-xl border p-2 text-left transition ${t.account}`}
        >
          <Avatar name={displayName} src={avatarUrl} className="h-9 w-9 text-sm" />
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-sm font-semibold ${t.name}`}>{displayName}</span>
            <span className={`block truncate text-xs ${t.email}`}>{user?.email || profile?.email}</span>
          </span>
          <ChevronDown size={16} className={`shrink-0 transition-transform ${t.chevron} ${accountOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
  );

  return (
    <div className="app-bg flex h-[100dvh] overflow-hidden bg-slate-50">
      <style>{layoutCss}</style>

      {/* Desktop: sidebar tetap */}
      <div className="hidden lg:block">{sidebar}</div>

      {/* Mobile: bottom sheet berisi semua menu */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className={`absolute inset-0 bg-black/35 backdrop-blur-[3px] transition-opacity duration-300 ease-out motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
            onClick={closeSheet}
          />
          {/* Pembungkus hanya menggeser (transform); efek glass ada di elemen dalam */}
          <div
            className={`absolute inset-x-0 bottom-0 transition-transform duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none ${shown ? "translate-y-0" : "translate-y-full"}`}
          >
          <div
            className={`hide-scrollbar max-h-[88dvh] overflow-y-auto rounded-t-3xl border-x border-t px-4 pt-3 shadow-2xl ${t.sheet}`}
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom) + 6.5rem)",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
            }}
          >
            <div className={`mx-auto mb-4 h-1 w-10 rounded-full ${t.grip}`} />

            {/* Identitas */}
            <div className="flex items-center gap-3">
              <img src={logo} alt="Logo UMKITA" className="h-10 w-auto shrink-0 object-contain" />
              <div className="min-w-0">
                <p className={`truncate text-base font-extrabold tracking-tight ${t.title}`}>{title}</p>
                {subtitle && <p className={`truncate font-mono text-[11px] ${t.email}`}>{subtitle}</p>}
              </div>
            </div>

            {/* Semua menu */}
            <p className={`px-1 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-widest ${t.label}`}>Menu</p>
            <div className="grid grid-cols-3 gap-2.5">
              {links.map(({ to, label, icon, end }) => (
                <SheetTile key={to} to={to} label={label} icon={icon} end={end} t={t} onClick={closeSheet} />
              ))}
            </div>

            {specialLinks.length > 0 && (
              <>
                <p className={`px-1 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-widest ${t.label}`}>Fitur Khusus</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {specialLinks.map(({ to, label, icon, end }) => (
                    <SheetTile key={to} to={to} label={label} icon={icon} end={end} t={t} onClick={closeSheet} />
                  ))}
                </div>
              </>
            )}

            {sidebarWidget && <div className="-mx-4 mt-4">{sidebarWidget}</div>}

            {/* Akun */}
            <div className={`mt-5 rounded-2xl border p-2 ${t.glassCard}`}>
              <div className="flex items-center gap-2.5 p-1.5">
                <Avatar name={displayName} src={avatarUrl} className="h-10 w-10 text-sm" />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-semibold ${t.name}`}>{displayName}</span>
                  <span className={`block truncate text-xs ${t.email}`}>{user?.email || profile?.email}</span>
                </span>
              </div>
              <div className={`my-1.5 border-t ${t.divider}`} />
              <Link to={`${accountBase}/profil`} onClick={closeSheet} className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition ${t.menuItem}`}>
                <MenuIcon icon={UserRound} /> Profil Saya
              </Link>
              <Link to={`${accountBase}/pengaturan`} onClick={closeSheet} className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium transition ${t.menuItem}`}>
                <MenuIcon icon={Settings2} /> Pengaturan
              </Link>
              <button
                type="button"
                disabled={loggingOut}
                onClick={logout}
                className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition disabled:opacity-60 ${t.menuItem} ${t.danger}`}
              >
                <MenuIcon icon={LogOut} danger /> {loggingOut ? "Keluar…" : "Keluar"}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Mobile: dock gradien dengan lekukan di tengah untuk tombol menu */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-3 z-50 h-16 lg:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        {/* Bayangan: lapisan tipis berbentuk dock, drop-shadow mengikuti lekukan */}
        <div className="pointer-events-none absolute inset-0" style={{ filter: "drop-shadow(0 8px 14px rgb(2 6 23))" }}>
          <div className="absolute inset-0 rounded-[26px] bg-slate-900/[0.14]" style={DOCK_MASK_STYLE} />
        </div>
        {/* Glass: bentuk bar + lekukan (mask) dengan blur */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-[26px] backdrop-blur-2xl backdrop-saturate-150 ${t.dockFill}`}
          style={DOCK_MASK_STYLE}
        />

        {/* Border tipis: sisi kiri & kanan memakai border biasa, bagian tengah (lekukan) digambar SVG */}
        <div className={`pointer-events-none absolute inset-0 flex ${t.dockBorder}`} aria-hidden="true">
          <div className="w-[calc(50%-60px)] rounded-l-[26px] border-y border-l border-current" />
          <svg className="h-full w-[120px] shrink-0" viewBox="0 0 120 64" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M0 .5H11Q23 .5 23 13A37 37 0 0 0 97 13Q97 .5 109 .5H120M0 63.5H120" />
          </svg>
          <div className="flex-1 rounded-r-[26px] border-y border-r border-current" />
        </div>

        {/* Ikon: 2 kiri, ruang kosong untuk tombol, 2 kanan */}
        <div className="relative z-10 flex h-full items-center px-1">
          <div className="flex flex-1 items-center">
            {dockLinks.slice(0, 2).map(({ to, label, icon, end }) => (
              <DockItem key={to} to={to} label={label} icon={icon} end={end} t={t} onClick={closeSheet} />
            ))}
          </div>
          <div className="w-[92px] shrink-0" aria-hidden="true" />
          <div className="flex flex-1 items-center">
            {dockLinks.slice(2, 4).map(({ to, label, icon, end }) => (
              <DockItem key={to} to={to} label={label} icon={icon} end={end} t={t} onClick={closeSheet} />
            ))}
          </div>
        </div>

        {/* Tombol menu: mengambang di dalam lekukan yang transparan (tanpa cincin) */}
        <div className="absolute left-1/2 top-[-24px] z-10 h-[74px] w-[74px] -translate-x-1/2">
          <button
            type="button"
            onClick={() => (shown ? closeSheet() : openSheet())}
            aria-expanded={shown}
            aria-label={shown ? "Tutup menu" : "Buka menu"}
            className={`absolute inset-[9px] flex items-center justify-center rounded-full bg-gradient-to-br text-white from-brand-500 to-sky-400 shadow-lg shadow-brand-700/30 transition active:scale-90`}
          >
            {shown ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col">
        <main data-dashboard-scroll className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-slate-50 app-bg">
          {/* Header kaca: menempel di atas dan konten halaman bergulir di bawahnya, sehingga blur terlihat */}
          <header
            className={`sticky top-0 isolate z-20 flex shrink-0 min-h-16 items-center gap-4 overflow-hidden border-b border-slate-500/20 bg-slate-500/10 px-4 py-3 lg:px-8 ${headerRight ? "" : "lg:hidden"}`}
            style={{ backdropFilter: "blur(20px) saturate(170%)", WebkitBackdropFilter: "blur(20px) saturate(170%)" }}
          >
            {/* Dekorasi: cahaya hijau di sisi kanan + garis gradien tipis di bawah header */}
            <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 bg-gradient-to-l from-brand-500/10 via-brand-500/5 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

            {/* Mobile: logo + judul menggantikan tombol hamburger lama */}
            <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <img src={logo} alt="Logo UMKITA" className="h-8 w-auto shrink-0 object-contain" />
              <p className="truncate text-base font-bold text-slate-900">{title}</p>
            </div>

            {headerRight && (
              <div className="hidden min-w-0 items-center gap-4 sm:flex">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">Selamat {greeting}, {firstName}</p>
                  <p className="truncate text-xs text-slate-500">{today}</p>
                </div>
                <LiveClock />
              </div>
            )}

            {headerRight && <div className="ml-auto min-w-0">{headerRight}</div>}
          </header>

          {/* pb-28 memberi ruang agar konten paling bawah tidak tertutup dock (hanya di mobile) */}
          <div className="flex-1 p-4 pb-28 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}