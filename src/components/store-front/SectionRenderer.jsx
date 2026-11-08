import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Quote,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Star,
  List,
  X,
  Plus,
  ArrowLeft,
  LayoutGrid,
  Utensils,
  Coffee,
  Pizza,
  Cake,
  Sandwich,
  Cookie,
  Salad,
  Soup,
  Beef,
  Fish,
  Wine,
  Store,
} from "lucide-react";
import { rupiah, getDiscountedPrice } from "../../lib/utils";
import Modal from "../ui/Modal";
import ProductImage from "../ui/ProductImage";
import { DEFAULT_LAYOUTS } from "./sectionDefs";
import { CATEGORY_ICON_MAP } from "./categoryIcons";

function WhatsAppIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function SectionRenderer({ section, store, products = [], discounts = [], primary, layout: layoutHint }) {
  const c = section.content || {};
  const color = primary || store?.theme?.primary || "#047857";
  const style = { backgroundColor: c.bg, color: c.textColor };
  const layout = c.layout || layoutHint || DEFAULT_LAYOUTS[section.type];

  switch (section.type) {
    case "hero":
      return <HeroSection c={c} style={style} color={color} layout={layout} />;
    case "about":
      return <AboutSection c={c} style={style} color={color} layout={layout} />;
    case "products":
      return <ProductsSection c={c} style={style} store={store} products={products} discounts={discounts} color={color} layout={layout} />;
    case "gallery":
      return <GallerySection c={c} style={style} layout={layout} />;
    case "testimonials":
      return <TestimonialsSection c={c} style={style} color={color} layout={layout} />;
    case "contact":
      return <ContactSection c={c} style={style} store={store} color={color} layout={layout} />;
    default:
      return null;
  }
}

/* ============================ HERO ============================ */

function HeroSection({ c, style, color, layout }) {
  const image = c.image;
  const textBlock = (alignClass = "") => (
    <>
      <h1 className="text-3xl font-extrabold sm:text-5xl">{c.title}</h1>
      <p className="mt-4 text-lg opacity-90">{c.subtitle}</p>
      {c.buttonText && (
        <a
          href="#products"
          className={`mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold shadow transition hover:opacity-90 ${alignClass}`}
          style={{ color: c.bg && c.bg !== "#ffffff" ? c.bg : color }}
        >
          {c.buttonText}
        </a>
      )}
    </>
  );

  if (layout === "split") {
    return (
      <section id="hero" style={style} className="px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>{textBlock()}</div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
            {image ? <img src={image} alt={c.title} className="h-full w-full object-cover" /> : <HeroPlaceholder color={color} />}
          </div>
        </div>
      </section>
    );
  }

  if (layout === "asym") {
    const tint = c.bg || color;
    return (
      <section id="hero" className="relative overflow-hidden px-6 pb-16 pt-16 sm:pb-20 sm:pt-20">
        <div className="absolute inset-0" style={{ background: tint, opacity: 0.1 }} />
        <div className="relative mx-auto grid max-w-6xl gap-10 md:grid-cols-[5fr_4fr] md:items-center">
          <div className="relative z-10 order-2 rounded-3xl bg-white/95 p-8 shadow-xl backdrop-blur md:order-1 md:-mr-16 md:rounded-r-none md:p-10">
            <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">{c.title}</h1>
            <p className="mt-3 text-slate-600">{c.subtitle}</p>
            {c.buttonText && (
              <a href="#products" className="mt-6 inline-block rounded-lg px-6 py-3 font-semibold text-white shadow transition hover:opacity-90" style={{ background: color }}>
                {c.buttonText}
              </a>
            )}
          </div>
          <div className="relative order-1 md:order-2">
            <div className="aspect-[4/5] max-h-[420px] overflow-hidden rounded-3xl shadow-lg md:aspect-auto md:h-full">
              {image ? <img src={image} alt={c.title} className="h-full w-full object-cover" /> : <HeroPlaceholder color={color} tall />}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (layout === "full") {
    return (
      <section
        id="hero"
        style={{
          backgroundColor: c.bg,
          color: c.textColor,
          backgroundImage: image ? `linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)), url(${c.image})` : `linear-gradient(135deg, ${color}, ${color}bb)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="flex min-h-[65vh] items-center px-6 py-24"
      >
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-extrabold sm:text-5xl">{c.title}</h1>
          <p className="mt-4 text-lg opacity-90">{c.subtitle}</p>
          {c.buttonText && (
            <a
              href="#products"
              className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold shadow transition hover:opacity-90"
              style={{ color: c.bg && c.bg !== "#ffffff" ? c.bg : color }}
            >
              {c.buttonText}
            </a>
          )}
        </div>
      </section>
    );
  }

  // center (default — kompatibel dengan perilaku lama: c.align dihormati)
  const alignment = c.align === "left" ? "text-left" : "text-center";
  return (
    <section
      id="hero"
      style={{
        ...style,
        backgroundImage: c.image ? `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), url(${c.image})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="px-6 py-20 sm:py-28"
    >
      <div className={`mx-auto max-w-4xl ${alignment}`}>{textBlock(c.align === "left" ? "" : "")}</div>
    </section>
  );
}

function HeroPlaceholder({ color, tall = false }) {
  return (
    <div className={`grid h-full ${tall ? "min-h-[240px]" : ""} place-items-center`} style={{ background: `linear-gradient(135deg, ${color}44, ${color}88)` }}>
      <span className="rounded-2xl bg-white/90 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm">Tambahkan gambar di editor Hero</span>
    </div>
  );
}

/* ============================ ABOUT ============================ */

function AboutSection({ c, style, color, layout }) {
  const img = c.image;

  if (layout === "bgimage") {
    return (
      <section id="about" className="relative px-6 py-20" style={{ color: "#f8fafc" }}>
        <div
          className="absolute inset-0"
          style={
            img
              ? { backgroundImage: `linear-gradient(rgba(2,6,23,.68),rgba(2,6,23,.68)), url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: c.bg && c.bg !== "#ffffff" ? c.bg : color }
          }
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{c.title}</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed opacity-90">{c.text}</p>
        </div>
      </section>
    );
  }

  if (layout === "editorial") {
    return (
      <section id="about" style={style} className="px-6 py-20">
        <div className="mx-auto grid max-w-5xl items-start gap-10 md:grid-cols-[2fr_3fr]">
          <div>
            <h2 className="text-4xl font-black leading-tight sm:text-5xl">{c.title}</h2>
            <span className="mt-4 block h-1.5 w-16 rounded-full" style={{ background: color }} />
          </div>
          <div className="md:border-l md:border-slate-200 md:pl-10">
            <p className="text-lg leading-relaxed opacity-90">{c.text}</p>
            {img && <img src={img} alt={c.title} className="mt-6 w-full rounded-2xl object-cover shadow-lg" />}
          </div>
        </div>
      </section>
    );
  }

  // two (default — kompatibel: imageSide dihormati)
  return (
    <section id="about" style={style} className="px-6 py-16">
      <div className={`mx-auto flex max-w-5xl flex-col items-center gap-10 ${c.imageSide === "left" ? "md:flex-row-reverse" : "md:flex-row"}`}>
        <div className="flex-1">
          <h2 className="text-3xl font-bold">{c.title}</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed opacity-90">{c.text}</p>
        </div>
        {img && <img src={img} alt={c.title} className="w-full max-w-sm rounded-2xl object-cover shadow-lg md:w-2/5" />}
      </div>
    </section>
  );
}

/* ============================ PRODUCTS ============================ */

// Kunci filter untuk produk yang belum punya kategori
const NO_CATEGORY = "__none";

// Nama kategori sebuah produk. Mendukung kolom teks `category` atau relasi yang sudah di-join
// (mis. category:categories(name)). Kalau kolom di tabel products-mu bernama lain, ubah di sini.
const getCategory = (p) => {
  const raw = p.category ?? p.category_name ?? p.categories ?? p.product_categories;
  const first = Array.isArray(raw) ? raw[0] : raw;
  const name = first && typeof first === "object" ? first.name : first;
  return typeof name === "string" && name.trim() ? name.trim() : null;
};

const getCategoryIconKey = (p) => {
  const raw = p.categories ?? p.product_categories;
  const first = Array.isArray(raw) ? raw[0] : raw;
  return first && typeof first === "object" && first.icon ? first.icon : null;
};

// Ikon tombol kategori di modal menu, dipilih dari kata kunci nama kategori (default: Utensils)
const CATEGORY_ICONS = [
  [/\b(minum|minuman|drink|beverage|kopi|coffee|teh|tea|jus|juice|es|latte)\b/, Coffee],
  [/pizza/, Pizza],
  [/(dessert|kue|cake|manis|sweet|bakery|roti|pastry)/, Cake],
  [/(burger|sandwich|kebab)/, Sandwich],
  [/(snack|camilan|cemilan|gorengan|cookie|keripik)/, Cookie],
  [/(salad|sayur|vegetarian|vegan)/, Salad],
  [/(sup|soup|soto|bakso)/, Soup],
  [/(ayam|daging|beef|steak|grill|bbq|sate)/, Beef],
  [/(ikan|seafood|fish|udang)/, Fish],
  [/(wine|bir|beer|cocktail)/, Wine],
];
const categoryIcon = (label) => {
  const s = label.toLowerCase();
  return CATEGORY_ICONS.find(([re]) => re.test(s))?.[1] || Utensils;
};

function ProductsSection({ c, style, store, products, discounts, color, layout }) {
  const rootRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [activeCat, setActiveCat] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuItem, setMenuItem] = useState(null); // produk yang sedang dilihat di dalam modal menu
  const [menuCat, setMenuCat] = useState("all");

  const wa = (store?.whatsapp || "").replace(/\D/g, "");
  const all = products.filter((p) => p.is_active);

  const iconByCat = {};
  all.forEach((p) => {
    const n = getCategory(p);
    if (n && !iconByCat[n]) {
      const k = getCategoryIconKey(p);
      if (k) iconByCat[n] = k;
    }
  });

  // Kategori diambil otomatis dari produk; filter tidak muncul kalau belum ada produk berkategori
  const named = [...new Set(all.map(getCategory).filter(Boolean))];
  const hasUncategorized = all.some((p) => !getCategory(p));
  const categories = named.length ? [...named, ...(hasUncategorized ? [NO_CATEGORY] : [])] : [];
  const categoryLabel = (key) => (key === NO_CATEGORY ? "Lainnya" : key);
  const inCategory = (p, key) => key === "all" || (key === NO_CATEGORY ? !getCategory(p) : getCategory(p) === key);
  const validCat = (key) => (key === "all" || categories.includes(key) ? key : "all");

  const currentCat = validCat(activeCat);
  const list = all.filter((p) => inCategory(p, currentCat)).slice(0, c.limit || 8);

  const currentMenuCat = validCat(menuCat);
  const menuList = all.filter((p) => inCategory(p, currentMenuCat));

  const closeMenu = () => {
    setMenuOpen(false);
    setMenuItem(null);
  };

  // Modal menu: kunci scroll halaman + tombol Escape (Escape dari detail kembali ke daftar)
  useEffect(() => {
    if (!menuOpen) return undefined;
    const doc = rootRef.current?.ownerDocument || document;
    const root = doc.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (menuItem) setMenuItem(null);
      else setMenuOpen(false);
    };
    doc.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = prevOverflow;
      doc.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, menuItem]);

  const waLink = (p) => `https://wa.me/${wa}?text=${encodeURIComponent(`Halo, saya ingin memesan *${p.name}* (${rupiah(getDiscountedPrice(p, discounts).final)})`)}`;

  const DiscountBadge = ({ d, className = "absolute left-2 top-2" }) =>
    d.discount ? (
      <span className={`${className} rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white`}>
        {d.discount.type === "percent" ? `-${Number(d.discount.value)}%` : "Diskon"}
      </span>
    ) : null;

  const Price = ({ p, size = "text-sm sm:text-base", className = "" }) => {
    const d = getDiscountedPrice(p, discounts);
    return (
      <div className={`flex flex-wrap items-baseline gap-x-2 ${className}`}>
        <span className={`font-bold ${size}`} style={{ color }}>
          {rupiah(d.final)}
        </span>
        {d.discount && <span className="text-xs text-slate-400 line-through sm:text-sm">{rupiah(p.price)}</span>}
      </div>
    );
  };

  // Isi detail produk — dipakai di Modal detail (klik produk di section) dan di dalam modal menu
  const renderDetail = (p) => {
    const d = getDiscountedPrice(p, discounts);
    return (
      <div className="space-y-4 text-slate-800">
        <ProductImage src={p.image_url} alt={p.name} className="max-h-72 w-full rounded-lg object-cover" />
        <div>
          <span className="text-2xl font-bold" style={{ color }}>
            {rupiah(d.final)}
          </span>
          {d.discount && <span className="ml-2 text-slate-400 line-through">{rupiah(p.price)}</span>}
        </div>
        <p className="whitespace-pre-line text-sm text-slate-600">{p.description || "Tidak ada deskripsi."}</p>
        <p className="text-sm text-slate-500">Stok: {p.stock}</p>
        {wa && p.stock > 0 && (
          <a
            href={waLink(p)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            <MessageCircle size={18} /> Pesan via WhatsApp
          </a>
        )}
      </div>
    );
  };

  // Deretan tombol kategori. Dipanggil sebagai fungsi (bukan komponen) supaya tidak di-mount ulang tiap render.
  //  - variant 'section': tombol kotak membulat (outline), tampil di bawah subjudul produk
  //  - variant 'modal'  : tombol pil dengan ikon, tampil di atas daftar menu pada modal
  const categoryBar = (value, onChange, variant = "section") => {
    if (categories.length === 0) return null;
    const modal = variant === "modal";
    return (
      <div
        role="group"
        aria-label="Filter kategori"
        className={`hide-scrollbar flex gap-2 overflow-x-auto py-1 ${modal ? "" : "sm:flex-wrap sm:justify-center sm:overflow-visible"}`}
      >
        {["all", ...categories].map((key) => {
          const active = value === key;
          const label = key === "all" ? "Semua" : categoryLabel(key);
          const Icon = key === "all" ? LayoutGrid : CATEGORY_ICON_MAP[iconByCat[key]] || categoryIcon(label);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-pressed={active}
              className={
                modal
                  ? `inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active ? "text-white shadow-md" : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 hover:ring-slate-300"
                    }`
                  : `shrink-0 rounded-lg border px-4 py-1.5 text-sm font-semibold transition ${
                      active ? "border-transparent text-white shadow-sm" : "border-slate-300 bg-white text-slate-800 hover:border-slate-400"
                    }`
              }
              style={active ? { background: color } : undefined}
            >
              {modal && <Icon size={16} />}
              {label}
            </button>
          );
        })}
      </div>
    );
  };

  const hasFilter = categories.length > 0;
  const bodyTop = hasFilter ? "mt-6" : "mt-10";
  // Layout horizontal tidak punya padding samping di <section>, jadi elemen tambahan perlu px sendiri
  const pad = layout === "horizontal" ? "px-6" : "";

  const header = (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-center text-3xl font-bold">{c.title}</h2>
      {c.subtitle && <p className="mt-2 text-center opacity-70">{c.subtitle}</p>}
    </div>
  );
  const empty =
    list.length === 0 ? (
      <p className="mt-10 text-center opacity-60">{all.length === 0 ? "Belum ada produk. Tambahkan produk dari Dashboard Toko." : "Belum ada produk di kategori ini."}</p>
    ) : null;

  let body = null;
  if (list.length === 0) {
    body = null;
  } else if (layout === "featured") {
    const [featured, ...rest] = list;
    const fd = getDiscountedPrice(featured, discounts);
    body = (
      <div className={`mx-auto ${bodyTop} grid max-w-6xl gap-6 lg:grid-cols-[3fr_2fr]`}>
        <button type="button" onClick={() => setSelected(featured)} className="overflow-hidden rounded-2xl bg-white text-left text-slate-800 shadow-sm transition hover:shadow-lg">
          <div className="relative aspect-[16/10] bg-slate-100">
            <ProductImage src={featured.image_url} alt={featured.name} />
            <DiscountBadge d={fd} className="absolute left-3 top-3" />
            {featured.stock <= 0 && <span className="absolute inset-0 flex items-center justify-center bg-black/50 font-bold text-white">Habis</span>}
          </div>
          <div className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
              Produk unggulan
            </span>
            <p className="mt-1 text-xl font-bold text-slate-900">{featured.name}</p>
            <Price p={featured} size="text-2xl" />
          </div>
        </button>
        <div className="grid grid-cols-2 gap-4">
          {rest.slice(0, 4).map((p) => {
            const d = getDiscountedPrice(p, discounts);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p)}
                className="overflow-hidden rounded-xl bg-white text-left text-slate-800 shadow-sm transition hover:shadow-lg"
              >
                <div className="relative aspect-square bg-slate-100">
                  <ProductImage src={p.image_url} alt={p.name} />
                  <DiscountBadge d={d} />
                  {p.stock <= 0 && <span className="absolute inset-0 flex items-center justify-center bg-black/50 font-bold text-white">Habis</span>}
                </div>
                <div className="p-3">
                  <p className="truncate font-semibold text-slate-900">{p.name}</p>
                  <Price p={p} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  } else if (layout === "horizontal") {
    body = (
      <div className={`hide-scrollbar ${bodyTop} flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4`}>
        {list.map((p) => {
          const d = getDiscountedPrice(p, discounts);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              className="w-52 shrink-0 snap-start overflow-hidden rounded-xl bg-white text-left text-slate-800 shadow-sm transition hover:shadow-lg"
            >
              <div className="relative aspect-square bg-slate-100">
                <ProductImage src={p.image_url} alt={p.name} />
                <DiscountBadge d={d} />
                {p.stock <= 0 && <span className="absolute inset-0 flex items-center justify-center bg-black/50 font-bold text-white">Habis</span>}
              </div>
              <div className="p-4">
                <p className="truncate font-semibold text-slate-900">{p.name}</p>
                <Price p={p} />
              </div>
            </button>
          );
        })}
      </div>
    );
  } else if (layout === "compact") {
    body = (
      <div className={`mx-auto ${hasFilter ? "mt-6" : "mt-8"} max-w-3xl divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm`}>
        {list.map((p) => (
          <button key={p.id} type="button" onClick={() => setSelected(p)} className="flex w-full items-center gap-4 p-3 text-left transition hover:bg-slate-50">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              <ProductImage src={p.image_url} alt={p.name} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{p.name}</p>
              <span className="text-xs text-slate-500">{p.stock > 0 ? `Stok ${p.stock}` : "Stok habis"}</span>
            </div>
            <Price p={p} />
          </button>
        ))}
      </div>
    );
  } else {
    // grid (default) — 2 kolom di mobile, jumlah kolom pilihan pengguna berlaku mulai tablet
    const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-3 lg:grid-cols-4" }[c.columns] || "sm:grid-cols-3";
    body = (
      <div className={`mx-auto ${bodyTop} grid max-w-6xl grid-cols-2 gap-3 sm:gap-5 ${cols}`} style={{ width: "100%" }}>
        {list.map((p) => {
          const d = getDiscountedPrice(p, discounts);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              className="overflow-hidden rounded-xl bg-white text-left text-slate-800 shadow-sm transition hover:shadow-lg"
            >
              <div className="relative aspect-square bg-slate-100">
                <ProductImage src={p.image_url} alt={p.name} />
                <DiscountBadge d={d} />
                {p.stock <= 0 && <span className="absolute inset-0 flex items-center justify-center bg-black/50 font-bold text-white">Habis</span>}
              </div>
              <div className="p-3 sm:p-4">
                <p className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-base">{p.name}</p>
                <Price p={p} />
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <section ref={rootRef} id="products" style={style} className={layout === "horizontal" ? "py-16" : "px-4 py-16 sm:px-6"}>
      {header}

      {/* Filter kategori: tepat di bawah subjudul produk */}
      {hasFilter && <div className={`mx-auto mt-6 max-w-6xl ${pad}`}>{categoryBar(currentCat, setActiveCat)}</div>}

      {empty}
      {body}

      {/* Tombol menampilkan seluruh menu toko */}
      {all.length > 0 && (
        <div className={`mx-auto mt-8 flex max-w-6xl justify-center ${pad}`}>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white shadow transition hover:opacity-90"
            style={{ background: color }}
          >
            <List size={18} /> Lihat Semua Menu
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">{all.length}</span>
          </button>
        </div>
      )}

      {/* Modal menu: header + filter kategori (pil dengan ikon) + daftar kartu menu.
          Dibuat sendiri (bukan <Modal>) agar tampilannya bebas diatur; detail produk dibuka di dalam panel yang sama. */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Semua menu">
          <div className="absolute inset-0 bg-black/50" onClick={closeMenu} />
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white text-slate-900 shadow-2xl sm:rounded-3xl">
            {/* Header */}
            <div className="flex shrink-0 items-start gap-3 px-4 pt-5 sm:px-6">
              {menuItem ? (
                <button
                  type="button"
                  onClick={() => setMenuItem(null)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  <ArrowLeft size={16} /> Kembali ke menu
                </button>
              ) : (
                <>
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl" style={{ background: `${color}26`, color }}>
                    {store?.logo_url ? (
                      <img src={store.logo_url} alt={store.name} className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                    ) : (
                      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white" style={{ background: color }}>
                        <Store size={26} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h3 className="text-2xl font-extrabold leading-tight">Menu Kami</h3>
                    <p className="text-sm text-slate-500">Nikmati berbagai pilihan menu lezat kami</p>
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Tutup menu"
                className="ml-auto shrink-0 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {menuItem ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 sm:px-6">
                <h3 className="mb-3 text-xl font-bold">{menuItem.name}</h3>
                {renderDetail(menuItem)}
              </div>
            ) : (
              <>
                {hasFilter && <div className="shrink-0 px-4 pt-4 sm:px-6">{categoryBar(currentMenuCat, setMenuCat, "modal")}</div>}

                {/* Daftar menu */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 sm:px-6">
                  {menuList.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">Belum ada menu di kategori ini.</p>
                  ) : (
                    <ul className="space-y-3">
                      {menuList.map((p) => {
                        const d = getDiscountedPrice(p, discounts);
                        const soldOut = p.stock <= 0;
                        return (
                          <li key={p.id}>
                            <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md sm:gap-4">
                              <button type="button" onClick={() => setMenuItem(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4">
                                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-24 sm:w-32">
                                  <ProductImage src={p.image_url} alt={p.name} />
                                  {d.discount && (
                                    <span className="absolute left-1.5 top-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                      {d.discount.type === "percent" ? `-${Number(d.discount.value)}%` : "Diskon"}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 sm:text-base">{p.name}</p>
                                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-600 sm:text-sm">{p.description || "Belum ada deskripsi."}</p>
                                  <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
                                    <span className="text-base font-extrabold text-slate-900 sm:text-lg">{rupiah(d.final)}</span>
                                    {d.discount && <span className="text-xs text-slate-400 line-through">{rupiah(p.price)}</span>}
                                    {soldOut && <span className="text-xs font-semibold text-red-600">Habis</span>}
                                  </div>
                                </div>
                              </button>

                              {wa && !soldOut ? (
                                <a
                                  href={waLink(p)}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`Pesan ${p.name} via WhatsApp`}
                                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#25D366] text-white shadow-sm transition hover:bg-[#1ebe5b] sm:h-11 sm:w-11"
                                >
                                  <WhatsAppIcon />
                                </a>
                              ) : (
                                <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-300 text-white sm:h-11 sm:w-11">
                                  <WhatsAppIcon />
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Detail produk saat produk di section diklik */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && renderDetail(selected)}
      </Modal>
    </section>
  );
}

/* ============================ GALLERY ============================ */

function GallerySection({ c, style, layout }) {
  const images = c.images || [];
  const title = <h2 className="text-center text-3xl font-bold">{c.title}</h2>;

  return (
    <section id="gallery" style={style} className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        {title}
        {images.length === 0 ? (
          <p className="mt-6 text-center opacity-60">Belum ada foto di galeri.</p>
        ) : layout === "masonry" ? (
          <div className="mt-8 columns-2 gap-3 [&>*]:mb-3 [&>*]:break-inside-avoid md:columns-3">
            {images.map((src, i) => (
              <img key={i} src={src} alt="" className="w-full rounded-xl object-cover" />
            ))}
          </div>
        ) : layout === "collage" && images.length > 1 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:grid-rows-2">
            <img src={images[0]} alt="" className="col-span-2 row-span-2 h-full min-h-64 w-full rounded-xl object-cover" style={{ aspectRatio: "auto" }} />
            {images.slice(1, 5).map((src, i) => (
              <img key={i + 1} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
            ))}
          </div>
        ) : (
          // uniform (default)
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
            {images.map((src, i) => (
              <img key={i} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================ TESTIMONIALS ============================ */

function TestimonialsSection({ c, style, color, layout }) {
  const scroller = useRef(null);
  const items = c.items || [];

  const scrollBy = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const Card = ({ t, big = false, compact = false }) => (
    <div
      className={
        big
          ? "rounded-2xl bg-white p-8 text-center text-slate-700 shadow-sm"
          : compact
            ? "rounded-xl bg-white p-4 text-slate-700 shadow-sm"
            : "rounded-xl bg-white p-6 text-slate-700 shadow-sm"
      }
    >
      <Quote size={big ? 34 : 20} style={{ color }} className={big ? "mx-auto" : ""} />
      <p className={big ? "mt-3 text-lg" : "mt-2"}>{t.text}</p>
      <p className={`${big ? "mt-4" : "mt-3"} text-sm font-semibold text-slate-900`}>— {t.name}</p>
    </div>
  );

  return (
    <section id="testimonials" style={style} className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{c.title}</h2>

        {items.length === 0 ? (
          <p className="mt-6 text-center opacity-60">Belum ada testimoni.</p>
        ) : layout === "carousel" ? (
          <div className="relative mt-8">
            <div ref={scroller} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
              {items.map((t, i) => (
                <div key={i} className="w-[85%] shrink-0 snap-start sm:w-[46%]">
                  <Card t={t} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                aria-label="Testimoni sebelumnya"
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:text-slate-900"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                aria-label="Testimoni berikutnya"
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:text-slate-900"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ) : layout === "featured" ? (
          <div className="mt-8">
            <Card t={items[0]} big />
            {items.length > 1 && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {items.slice(1).map((t, i) => (
                  <Card key={i} t={t} compact />
                ))}
              </div>
            )}
          </div>
        ) : (
          // cards (default)
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {items.map((t, i) => (
              <Card key={i} t={t} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================ CONTACT ============================ */

function ContactSection({ c, style, store, color, layout }) {
  const wa = (store?.whatsapp || "").replace(/\D/g, "");
  const infos = [
    { icon: MapPin, label: "Alamat", value: c.address },
    { icon: Phone, label: "Telepon / WA", value: store?.whatsapp },
    { icon: Mail, label: "Email", value: c.email },
    { icon: Clock, label: "Jam buka", value: c.hours },
  ].filter((x) => x.value);

  const mapBlock = (() => {
    if (c.lat != null && c.lng != null) {
      const src = `https://www.google.com/maps?q=${c.lat},${c.lng}&z=16&output=embed`;
      return <iframe title="Peta" src={src} className="h-64 w-full rounded-xl border-0" loading="lazy" />;
    }
    if (c.mapUrl && /maps\/embed/.test(c.mapUrl)) {
      return <iframe title="Peta" src={c.mapUrl} className="h-64 w-full rounded-xl border-0" loading="lazy" />;
    }
    if (c.mapUrl) {
      return (
        <a
          href={c.mapUrl}
          target="_blank"
          rel="noreferrer"
          className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/20 bg-white/5 text-center transition hover:bg-white/10"
        >
          <MapPin size={32} />
          <span className="flex items-center gap-1.5 font-semibold">
            Buka Lokasi di Google Maps <ExternalLink size={16} />
          </span>
        </a>
      );
    }
    return null;
  })();

  const waButton = wa && (
    <a
      href={`https://wa.me/${wa}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
    >
      <MessageCircle size={18} /> Chat WhatsApp
    </a>
  );

  if (layout === "cards") {
    return (
      <section id="contact" style={style} className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">{c.title}</h2>
          <div className={`mt-8 grid gap-4 ${infos.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
            {infos.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl bg-white/10 p-5 backdrop-blur">
                <Icon size={22} className="opacity-80" style={{ color }} />
                <p className="mt-3 text-xs font-bold uppercase tracking-wider opacity-60">{label}</p>
                <p className="mt-1 whitespace-pre-line text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
          {waButton && <div className="mt-8 flex justify-center">{waButton}</div>}
          {mapBlock && <div className="mt-8">{mapBlock}</div>}
        </div>
      </section>
    );
  }

  if (layout === "centered") {
    return (
      <section id="contact" style={style} className="px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">{c.title}</h2>
          <ul className="mt-8 space-y-4">
            {infos.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex flex-col items-center gap-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10" style={{ color: "#fff" }}>
                  <Icon size={18} />
                </span>
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">{label}</p>
                <p className="whitespace-pre-line font-medium">{value}</p>
              </li>
            ))}
          </ul>
          {waButton && <div className="mt-8 flex justify-center">{waButton}</div>}
          {mapBlock && <div className="mt-8">{mapBlock}</div>}
        </div>
      </section>
    );
  }

  // split (default)
  return (
    <section id="contact" style={style} className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{c.title}</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <ul className="space-y-4">
            {c.address && (
              <li className="flex gap-3">
                <MapPin className="shrink-0" size={20} /> {c.address}
              </li>
            )}
            {store?.whatsapp && (
              <li className="flex gap-3">
                <Phone className="shrink-0" size={20} /> {store.whatsapp}
              </li>
            )}
            {c.email && (
              <li className="flex gap-3">
                <Mail className="shrink-0" size={20} /> {c.email}
              </li>
            )}
            {c.hours && (
              <li className="flex gap-3">
                <Clock className="shrink-0" size={20} /> {c.hours}
              </li>
            )}
            {wa && (
              <li>
                <a
                  href={`https://wa.me/${wa}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
                >
                  <MessageCircle size={18} /> Chat WhatsApp
                </a>
              </li>
            )}
          </ul>
          {mapBlock}
        </div>
      </div>
    </section>
  );
}
