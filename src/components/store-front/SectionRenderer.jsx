import { useRef, useState } from 'react'
import { MapPin, Phone, Mail, Clock, MessageCircle, Quote, ExternalLink, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { rupiah, getDiscountedPrice } from '../../lib/utils'
import Modal from '../ui/Modal'
import ProductImage from '../ui/ProductImage'
import { DEFAULT_LAYOUTS } from './sectionDefs'

/**
 * Merender satu section. Dipakai di preview builder DAN halaman toko publik,
 * sehingga tampilannya selalu sama.
 *
 * Layout variant disimpan di content.layout (per section, dikustomisasi pengguna).
 * Untuk section lama yang belum memiliki pilihan, caller dapat memberi `layoutHint`
 * (layout default tema aktif); jika keduanya kosong, memakai DEFAULT_LAYOUTS.
 */
export default function SectionRenderer({ section, store, products = [], discounts = [], primary, layout: layoutHint }) {
  const c = section.content || {}
  const color = primary || store?.theme?.primary || '#047857'
  const style = { backgroundColor: c.bg, color: c.textColor }
  const layout = c.layout || layoutHint || DEFAULT_LAYOUTS[section.type]

  switch (section.type) {
    case 'hero':
      return <HeroSection c={c} style={style} color={color} layout={layout} />
    case 'about':
      return <AboutSection c={c} style={style} color={color} layout={layout} />
    case 'products':
      return <ProductsSection c={c} style={style} store={store} products={products} discounts={discounts} color={color} layout={layout} />
    case 'gallery':
      return <GallerySection c={c} style={style} layout={layout} />
    case 'testimonials':
      return <TestimonialsSection c={c} style={style} color={color} layout={layout} />
    case 'contact':
      return <ContactSection c={c} style={style} store={store} color={color} layout={layout} />
    default:
      return null
  }
}

/* ============================ HERO ============================ */

function HeroSection({ c, style, color, layout }) {
  const image = c.image
  const textBlock = (alignClass = '') => (
    <>
      <h1 className="text-3xl font-extrabold sm:text-5xl">{c.title}</h1>
      <p className="mt-4 text-lg opacity-90">{c.subtitle}</p>
      {c.buttonText && (
        <a
          href="#products"
          className={`mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold shadow transition hover:opacity-90 ${alignClass}`}
          style={{ color: c.bg && c.bg !== '#ffffff' ? c.bg : color }}
        >
          {c.buttonText}
        </a>
      )}
    </>
  )

  if (layout === 'split') {
    return (
      <section id="hero" style={style} className="px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <div>{textBlock()}</div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
            {image ? (
              <img src={image} alt={c.title} className="h-full w-full object-cover" />
            ) : (
              <HeroPlaceholder color={color} />
            )}
          </div>
        </div>
      </section>
    )
  }

  if (layout === 'asym') {
    const tint = c.bg || color
    return (
      <section id="hero" className="relative overflow-hidden px-6 pb-16 pt-16 sm:pb-20 sm:pt-20">
        <div className="absolute inset-0" style={{ background: tint, opacity: 0.1 }} />
        <div className="relative mx-auto grid max-w-6xl gap-10 md:grid-cols-[5fr_4fr] md:items-center">
          <div className="relative z-10 order-2 rounded-3xl bg-white/95 p-8 shadow-xl backdrop-blur md:order-1 md:-mr-16 md:rounded-r-none md:p-10">
            <h1 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">{c.title}</h1>
            <p className="mt-3 text-slate-600">{c.subtitle}</p>
            {c.buttonText && (
              <a
                href="#products"
                className="mt-6 inline-block rounded-lg px-6 py-3 font-semibold text-white shadow transition hover:opacity-90"
                style={{ background: color }}
              >
                {c.buttonText}
              </a>
            )}
          </div>
          <div className="relative order-1 md:order-2">
            <div className="aspect-[4/5] max-h-[420px] overflow-hidden rounded-3xl shadow-lg md:aspect-auto md:h-full">
              {image ? (
                <img src={image} alt={c.title} className="h-full w-full object-cover" />
              ) : (
                <HeroPlaceholder color={color} tall />
              )}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (layout === 'full') {
    return (
      <section
        id="hero"
        style={{
          backgroundColor: c.bg,
          color: c.textColor,
          backgroundImage: image
            ? `linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,.5)), url(${c.image})`
            : `linear-gradient(135deg, ${color}, ${color}bb)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        className="flex min-h-[65vh] items-center px-6 py-24"
      >
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-extrabold sm:text-5xl">{c.title}</h1>
          <p className="mt-4 text-lg opacity-90">{c.subtitle}</p>
          {c.buttonText && (
            <a href="#products" className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold shadow transition hover:opacity-90" style={{ color: c.bg && c.bg !== '#ffffff' ? c.bg : color }}>
              {c.buttonText}
            </a>
          )}
        </div>
      </section>
    )
  }

  // center (default — kompatibel dengan perilaku lama: c.align dihormati)
  const alignment = c.align === 'left' ? 'text-left' : 'text-center'
  return (
    <section
      id="hero"
      style={{
        ...style,
        backgroundImage: c.image ? `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)), url(${c.image})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      className="px-6 py-20 sm:py-28"
    >
      <div className={`mx-auto max-w-4xl ${alignment}`}>
        {textBlock(c.align === 'left' ? '' : '')}
      </div>
    </section>
  )
}

function HeroPlaceholder({ color, tall = false }) {
  return (
    <div
      className={`grid h-full ${tall ? 'min-h-[240px]' : ''} place-items-center`}
      style={{ background: `linear-gradient(135deg, ${color}44, ${color}88)` }}
    >
      <span className="rounded-2xl bg-white/90 px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm">
        Tambahkan gambar di editor Hero
      </span>
    </div>
  )
}

/* ============================ ABOUT ============================ */

function AboutSection({ c, style, color, layout }) {
  const img = c.image

  if (layout === 'bgimage') {
    return (
      <section id="about" className="relative px-6 py-20" style={{ color: '#f8fafc' }}>
        <div
          className="absolute inset-0"
          style={
            img
              ? { backgroundImage: `linear-gradient(rgba(2,6,23,.68),rgba(2,6,23,.68)), url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: c.bg && c.bg !== '#ffffff' ? c.bg : color }
          }
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">{c.title}</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed opacity-90">{c.text}</p>
        </div>
      </section>
    )
  }

  if (layout === 'editorial') {
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
    )
  }

  // two (default — kompatibel: imageSide dihormati)
  return (
    <section id="about" style={style} className="px-6 py-16">
      <div
        className={`mx-auto flex max-w-5xl flex-col items-center gap-10 ${
          c.imageSide === 'left' ? 'md:flex-row-reverse' : 'md:flex-row'
        }`}
      >
        <div className="flex-1">
          <h2 className="text-3xl font-bold">{c.title}</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed opacity-90">{c.text}</p>
        </div>
        {img && <img src={img} alt={c.title} className="w-full max-w-sm rounded-2xl object-cover shadow-lg md:w-2/5" />}
      </div>
    </section>
  )
}

/* ============================ PRODUCTS ============================ */

function ProductsSection({ c, style, store, products, discounts, color, layout }) {
  const [selected, setSelected] = useState(null)
  const wa = (store?.whatsapp || '').replace(/\D/g, '')
  const all = products.filter((p) => p.is_active)
  const list = all.slice(0, c.limit || 8)

  const waLink = (p) =>
    `https://wa.me/${wa}?text=${encodeURIComponent(`Halo, saya ingin memesan *${p.name}* (${rupiah(getDiscountedPrice(p, discounts).final)})`)}`

  const DiscountBadge = ({ d, className = 'absolute left-2 top-2' }) =>
    d.discount ? (
      <span className={`${className} rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white`}>
        {d.discount.type === 'percent' ? `-${Number(d.discount.value)}%` : 'Diskon'}
      </span>
    ) : null

  const Price = ({ p, size = '' }) => {
    const d = getDiscountedPrice(p, discounts)
    return (
      <div className="flex items-baseline gap-2">
        <span className={`font-bold ${size}`} style={{ color }}>{rupiah(d.final)}</span>
        {d.discount && <span className="text-sm text-slate-400 line-through">{rupiah(p.price)}</span>}
      </div>
    )
  }

  const header = (
    <div className="mx-auto max-w-6xl">
      <h2 className="text-center text-3xl font-bold">{c.title}</h2>
      {c.subtitle && <p className="mt-2 text-center opacity-70">{c.subtitle}</p>}
    </div>
  )
  const empty = list.length === 0 ? <p className="mt-10 text-center opacity-60">Belum ada produk. Tambahkan produk dari Dashboard Toko.</p> : null

  let body = null
  if (list.length === 0) {
    body = null
  } else if (layout === 'featured') {
    const [featured, ...rest] = list
    const fd = getDiscountedPrice(featured, discounts)
    body = (
      <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-[3fr_2fr]">
        <button
          type="button"
          onClick={() => setSelected(featured)}
          className="overflow-hidden rounded-2xl bg-white text-left text-slate-800 shadow-sm transition hover:shadow-lg"
        >
          <div className="relative aspect-[16/10] bg-slate-100">
            <ProductImage src={featured.image_url} alt={featured.name} />
            <DiscountBadge d={fd} className="absolute left-3 top-3" />
            {featured.stock <= 0 && <span className="absolute inset-0 flex items-center justify-center bg-black/50 font-bold text-white">Habis</span>}
          </div>
          <div className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>Produk unggulan</span>
            <p className="mt-1 text-xl font-bold text-slate-900">{featured.name}</p>
            <Price p={featured} size="text-2xl" />
          </div>
        </button>
        <div className="grid grid-cols-2 gap-4">
          {rest.slice(0, 4).map((p) => {
            const d = getDiscountedPrice(p, discounts)
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
            )
          })}
        </div>
      </div>
    )
  } else if (layout === 'horizontal') {
    body = (
      <div className="hide-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {list.map((p) => {
          const d = getDiscountedPrice(p, discounts)
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
          )
        })}
      </div>
    )
  } else if (layout === 'compact') {
    body = (
      <div className="mx-auto mt-8 max-w-3xl divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm">
        {list.map((p) => {
          const d = getDiscountedPrice(p, discounts)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p)}
              className="flex w-full items-center gap-4 p-3 text-left transition hover:bg-slate-50"
            >
              <div className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100`}>
                <ProductImage src={p.image_url} alt={p.name} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{p.name}</p>
                <span className="text-xs text-slate-500">{p.stock > 0 ? `Stok ${p.stock}` : 'Stok habis'}</span>
              </div>
              <Price p={p} />
            </button>
          )
        })}
      </div>
    )
  } else {
    // grid (default)
    const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[c.columns] || 'sm:grid-cols-3'
    body = (
      <div className={`mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-5 ${cols}`} style={{ width: '100%' }}>
        {list.map((p) => {
          const d = getDiscountedPrice(p, discounts)
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
              <div className="p-4">
                <p className="font-semibold text-slate-900">{p.name}</p>
                <Price p={p} />
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <section id="products" style={style} className={layout === 'horizontal' ? 'py-16' : 'px-6 py-16'}>
      {header}
      {empty}
      {body}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="space-y-4 text-slate-800">
            <ProductImage src={selected.image_url} alt={selected.name} className="max-h-72 w-full rounded-lg object-cover" />
            <div>
              <span className="text-2xl font-bold" style={{ color }}>
                {rupiah(getDiscountedPrice(selected, discounts).final)}
              </span>
              {getDiscountedPrice(selected, discounts).discount && (
                <span className="ml-2 text-slate-400 line-through">{rupiah(selected.price)}</span>
              )}
            </div>
            <p className="whitespace-pre-line text-sm text-slate-600">{selected.description || 'Tidak ada deskripsi.'}</p>
            <p className="text-sm text-slate-500">Stok: {selected.stock}</p>
            {wa && selected.stock > 0 && (
              <a
                href={waLink(selected)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle size={18} /> Pesan via WhatsApp
              </a>
            )}
          </div>
        )}
      </Modal>
    </section>
  )
}

/* ============================ GALLERY ============================ */

function GallerySection({ c, style, layout }) {
  const images = c.images || []
  const title = <h2 className="text-center text-3xl font-bold">{c.title}</h2>

  return (
    <section id="gallery" style={style} className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        {title}
        {images.length === 0 ? (
          <p className="mt-6 text-center opacity-60">Belum ada foto di galeri.</p>
        ) : layout === 'masonry' ? (
          <div className="mt-8 columns-2 gap-3 [&>*]:mb-3 [&>*]:break-inside-avoid md:columns-3">
            {images.map((src, i) => (
              <img key={i} src={src} alt="" className="w-full rounded-xl object-cover" />
            ))}
          </div>
        ) : layout === 'collage' && images.length > 1 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:grid-rows-2">
            <img src={images[0]} alt="" className="col-span-2 row-span-2 h-full min-h-64 w-full rounded-xl object-cover" style={{ aspectRatio: 'auto' }} />
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
  )
}

/* ============================ TESTIMONIALS ============================ */

function TestimonialsSection({ c, style, color, layout }) {
  const scroller = useRef(null)
  const items = c.items || []

  const scrollBy = (dir) => {
    const el = scroller.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  const Card = ({ t, big = false, compact = false }) => (
    <div className={big ? 'rounded-2xl bg-white p-8 text-center text-slate-700 shadow-sm' : compact ? 'rounded-xl bg-white p-4 text-slate-700 shadow-sm' : 'rounded-xl bg-white p-6 text-slate-700 shadow-sm'}>
      <Quote size={big ? 34 : 20} style={{ color }} className={big ? 'mx-auto' : ''} />
      <p className={big ? 'mt-3 text-lg' : 'mt-2'}>{t.text}</p>
      <p className={`${big ? 'mt-4' : 'mt-3'} text-sm font-semibold text-slate-900`}>— {t.name}</p>
    </div>
  )

  return (
    <section id="testimonials" style={style} className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{c.title}</h2>

        {items.length === 0 ? (
          <p className="mt-6 text-center opacity-60">Belum ada testimoni.</p>
        ) : layout === 'carousel' ? (
          <div className="relative mt-8">
            <div ref={scroller} className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
              {items.map((t, i) => (
                <div key={i} className="w-[85%] shrink-0 snap-start sm:w-[46%]">
                  <Card t={t} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" onClick={() => scrollBy(-1)} aria-label="Testimoni sebelumnya" className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:text-slate-900">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => scrollBy(1)} aria-label="Testimoni berikutnya" className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:text-slate-900">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ) : layout === 'featured' ? (
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
  )
}

/* ============================ CONTACT ============================ */

function ContactSection({ c, style, store, color, layout }) {
  const wa = (c.phone || store?.whatsapp || '').replace(/\D/g, '')
  const infos = [
    { icon: MapPin, label: 'Alamat', value: c.address },
    { icon: Phone, label: 'Telepon / WA', value: c.phone },
    { icon: Mail, label: 'Email', value: c.email },
    { icon: Clock, label: 'Jam buka', value: c.hours },
  ].filter((x) => x.value)

  const mapBlock = (() => {
    if (c.lat != null && c.lng != null) {
      const src = `https://www.google.com/maps?q=${c.lat},${c.lng}&z=16&output=embed`
      return <iframe title="Peta" src={src} className="h-64 w-full rounded-xl border-0" loading="lazy" />
    }
    if (c.mapUrl && /maps\/embed/.test(c.mapUrl)) {
      return <iframe title="Peta" src={c.mapUrl} className="h-64 w-full rounded-xl border-0" loading="lazy" />
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
      )
    }
    return null
  })()

  const waButton = wa && (
    <a
      href={`https://wa.me/${wa}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
    >
      <MessageCircle size={18} /> Chat WhatsApp
    </a>
  )

  if (layout === 'cards') {
    return (
      <section id="contact" style={style} className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold">{c.title}</h2>
          <div className={`mt-8 grid gap-4 ${infos.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
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
    )
  }

  if (layout === 'centered') {
    return (
      <section id="contact" style={style} className="px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">{c.title}</h2>
          <ul className="mt-8 space-y-4">
            {infos.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex flex-col items-center gap-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10" style={{ color: '#fff' }}>
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
    )
  }

  // split (default)
  return (
    <section id="contact" style={style} className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold">{c.title}</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <ul className="space-y-4">
            {c.address && <li className="flex gap-3"><MapPin className="shrink-0" size={20} /> {c.address}</li>}
            {c.phone && <li className="flex gap-3"><Phone className="shrink-0" size={20} /> {c.phone}</li>}
            {c.email && <li className="flex gap-3"><Mail className="shrink-0" size={20} /> {c.email}</li>}
            {c.hours && <li className="flex gap-3"><Clock className="shrink-0" size={20} /> {c.hours}</li>}
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
  )
}
