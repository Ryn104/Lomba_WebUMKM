import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, MessageCircle, Quote } from 'lucide-react'
import { rupiah, getDiscountedPrice } from '../../lib/utils'
import Modal from '../ui/Modal'

/**
 * Merender satu section. Dipakai di preview builder DAN halaman toko publik,
 * sehingga tampilannya selalu sama.
 */
export default function SectionRenderer({ section, store, products = [], discounts = [], primary }) {
  const c = section.content || {}
  const color = primary || store?.theme?.primary || '#4f46e5'
  const style = { backgroundColor: c.bg, color: c.textColor }

  switch (section.type) {
    case 'hero':
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
          <div className={`mx-auto max-w-4xl ${c.align === 'left' ? 'text-left' : 'text-center'}`}>
            <h1 className="text-3xl font-extrabold sm:text-5xl">{c.title}</h1>
            <p className="mt-4 text-lg opacity-90">{c.subtitle}</p>
            {c.buttonText && (
              <a
                href="#products"
                className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-semibold shadow"
                style={{ color: c.bg && c.bg !== '#ffffff' ? c.bg : color }}
              >
                {c.buttonText}
              </a>
            )}
          </div>
        </section>
      )

    case 'about':
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
            {c.image && <img src={c.image} alt={c.title} className="w-full max-w-sm rounded-2xl object-cover shadow-lg md:w-2/5" />}
          </div>
        </section>
      )

    case 'products':
      return <ProductsSection c={c} style={style} store={store} products={products} discounts={discounts} color={color} />

    case 'gallery':
      return (
        <section id="gallery" style={style} className="px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold">{c.title}</h2>
            {(c.images || []).length === 0 ? (
              <p className="mt-6 text-center opacity-60">Belum ada foto di galeri.</p>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
                {c.images.map((src, i) => (
                  <img key={i} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
                ))}
              </div>
            )}
          </div>
        </section>
      )

    case 'testimonials':
      return (
        <section id="testimonials" style={style} className="px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold">{c.title}</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {(c.items || []).map((t, i) => (
                <div key={i} className="rounded-xl bg-white p-6 text-slate-700 shadow-sm">
                  <Quote size={20} style={{ color }} />
                  <p className="mt-2">{t.text}</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">— {t.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )

    case 'contact': {
      const wa = (c.phone || store?.whatsapp || '').replace(/\D/g, '')
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
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white"
                    >
                      <MessageCircle size={18} /> Chat WhatsApp
                    </a>
                  </li>
                )}
              </ul>
              {c.mapUrl && (
                <iframe title="Peta" src={c.mapUrl} className="h-64 w-full rounded-xl border-0" loading="lazy" />
              )}
            </div>
          </div>
        </section>
      )
    }

    default:
      return null
  }
}

function ProductsSection({ c, style, store, products, discounts, color }) {
  const [selected, setSelected] = useState(null)
  const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' }[c.columns] || 'sm:grid-cols-3'
  const list = products.filter((p) => p.is_active).slice(0, c.limit || 8)
  const wa = (store?.whatsapp || '').replace(/\D/g, '')

  const waLink = (p) =>
    `https://wa.me/${wa}?text=${encodeURIComponent(`Halo, saya ingin memesan *${p.name}* (${rupiah(getDiscountedPrice(p, discounts).final)})`)}`

  return (
    <section id="products" style={style} className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold">{c.title}</h2>
        {c.subtitle && <p className="mt-2 text-center opacity-70">{c.subtitle}</p>}

        {list.length === 0 ? (
          <p className="mt-10 text-center opacity-60">Belum ada produk. Tambahkan produk dari Dashboard Toko.</p>
        ) : (
          <div className={`mt-10 grid grid-cols-1 gap-5 ${cols}`}>
            {list.map((p) => {
              const d = getDiscountedPrice(p, discounts)
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="overflow-hidden rounded-xl bg-white text-left text-slate-800 shadow-sm transition hover:shadow-lg"
                >
                  <div className="relative aspect-square bg-slate-100">
                    {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
                    {d.discount && (
                      <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        {d.discount.type === 'percent' ? `-${Number(d.discount.value)}%` : 'Diskon'}
                      </span>
                    )}
                    {p.stock <= 0 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 font-bold text-white">Habis</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold">{p.name}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-bold" style={{ color }}>{rupiah(d.final)}</span>
                      {d.discount && <span className="text-sm text-slate-400 line-through">{rupiah(p.price)}</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="space-y-4 text-slate-800">
            {selected.image_url && <img src={selected.image_url} alt="" className="max-h-72 w-full rounded-lg object-cover" />}
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
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white"
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
