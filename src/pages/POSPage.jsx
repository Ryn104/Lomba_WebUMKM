import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart, Banknote, QrCode, Landmark, Printer, CheckCircle2, X, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useMyStore } from '../hooks/useMyStore'
import { rupiah, getDiscountedPrice, formatDateTime } from '../lib/utils'
import { Spinner, EmptyState } from '../components/ui/Field'
import Modal from '../components/ui/Modal'
import CreateStore from '../components/builder/CreateStore'
import ProductImage from '../components/ui/ProductImage'
import MoneyInput from '../components/ui/MoneyInput'

export default function POSPage() {
  const { store, loading, reload } = useMyStore()
  if (loading) return <Spinner full />
  if (!store) return <CreateStore onCreated={reload} />
  return <POS store={store} />
}

const METHODS = [
  { id: 'cash', label: 'Tunai', icon: Banknote },
  { id: 'qris', label: 'QRIS', icon: QrCode },
  { id: 'transfer', label: 'Transfer', icon: Landmark },
]

// Bottom sheet mobile: terpasang dulu (mounted), lalu digeser naik (shown). Saat ditutup, geser turun baru dilepas.
function useSheet() {
  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(false)
  const timer = useRef(null)

  const open = useCallback(() => {
    clearTimeout(timer.current)
    setMounted(true)
    timer.current = setTimeout(() => setShown(true), 30)
  }, [])

  const close = useCallback(() => {
    clearTimeout(timer.current)
    setShown(false)
    timer.current = setTimeout(() => setMounted(false), 360)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (!mounted) return undefined
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mounted, close])

  return { mounted, shown, open, close }
}

function POS({ store }) {
  const [products, setProducts] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [categories, setCategories] = useState([])
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [cart, setCart] = useState([]) // [{product, qty}]
  const [method, setMethod] = useState('cash')
  const [paid, setPaid] = useState('')
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)
  const sheet = useSheet()

  const load = useCallback(async () => {
    const [p, d, c] = await Promise.all([
      supabase.from('products').select('*').eq('store_id', store.id).eq('is_active', true).order('name'),
      supabase.from('discounts').select('*').eq('store_id', store.id).eq('is_active', true),
      supabase.from('categories').select('*').eq('store_id', store.id).order('name'),
    ])
    setProducts(p.data || [])
    setDiscounts(d.data || [])
    setCategories(c.data || [])
    setLoading(false)
  }, [store.id])

  useEffect(() => { load() }, [load])

  // Keranjang kosong -> tutup bottom sheet (mobile)
  useEffect(() => {
    if (cart.length === 0 && sheet.mounted) sheet.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length])

  const filtered = products.filter(
    (p) => (cat === 'all' || p.category_id === cat) && p.name.toLowerCase().includes(q.toLowerCase())
  )

  const add = (product) => {
    if (product.stock <= 0) return toast.error('Stok habis')
    setCart((c) => {
      const ex = c.find((i) => i.product.id === product.id)
      if (ex) {
        if (ex.qty >= product.stock) { toast.error('Melebihi stok'); return c }
        return c.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...c, { product, qty: 1 }]
    })
  }

  const setQty = (id, delta) =>
    setCart((c) =>
      c
        .map((i) => {
          if (i.product.id !== id) return i
          const qty = i.qty + delta
          if (qty > i.product.stock) { toast.error('Melebihi stok'); return i }
          return { ...i, qty }
        })
        .filter((i) => i.qty > 0)
    )

  const lines = useMemo(
    () =>
      cart.map((i) => {
        const d = getDiscountedPrice(i.product, discounts)
        return { ...i, unit: d.final, discountPerUnit: d.amount, label: d.discount?.name }
      }),
    [cart, discounts]
  )

  const inCart = useMemo(() => Object.fromEntries(cart.map((i) => [i.product.id, i.qty])), [cart])
  const itemCount = cart.reduce((a, i) => a + i.qty, 0)

  const subtotal = lines.reduce((a, l) => a + l.product.price * l.qty, 0)
  const discountTotal = lines.reduce((a, l) => a + l.discountPerUnit * l.qty, 0)
  const total = subtotal - discountTotal
  const paidNum = method === 'cash' ? Number(paid) || 0 : total
  const change = Math.max(paidNum - total, 0)
  const canPay = lines.length > 0 && paidNum >= total

  const quick = [total, 20000, 50000, 100000].filter((v, i, a) => v > 0 && a.indexOf(v) === i)

  const checkout = async () => {
    setBusy(true)
    const items = lines.map((l) => ({
      product_id: l.product.id,
      product_name: l.product.name,
      price: l.product.price,
      qty: l.qty,
      discount: l.discountPerUnit * l.qty,
    }))
    const { data, error } = await supabase.rpc('create_pos_transaction', {
      p_store_id: store.id,
      p_items: items,
      p_discount_total: discountTotal,
      p_paid: paidNum,
      p_method: method,
    })
    setBusy(false)
    if (error) return toast.error('Transaksi gagal: ' + error.message)

    const { data: tx } = await supabase.from('transactions').select('*').eq('id', data).single()
    setReceipt({ tx, lines, method })
    setCart([])
    setPaid('')
    sheet.close()
    load() // refresh stok
  }

  if (loading) return <Spinner full />

  /* ---------- Potongan UI yang dipakai bersama (panel desktop & bottom sheet mobile) ---------- */

  const itemsList =
    lines.length === 0 ? (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
        <ShoppingCart size={28} />
        <p className="text-sm">Ketuk produk untuk menambahkan.</p>
      </div>
    ) : (
      <ul className="divide-y divide-slate-100">
        {lines.map((l) => (
          <li key={l.product.id} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-medium text-slate-900">{l.product.name}</p>
              <b className="shrink-0 text-sm text-slate-900">{rupiah(l.unit * l.qty)}</b>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs text-slate-500">
                {rupiah(l.unit)} {l.label && <span className="font-medium text-red-600">· {l.label}</span>}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="Kurangi"
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 active:scale-90"
                  onClick={() => setQty(l.product.id, -1)}
                >
                  {l.qty === 1 ? <Trash2 size={14} className="text-red-600" /> : <Minus size={14} />}
                </button>
                <span className="w-8 text-center text-sm font-semibold text-slate-800">{l.qty}</span>
                <button
                  type="button"
                  aria-label="Tambah"
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 active:scale-90"
                  onClick={() => setQty(l.product.id, 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    )

  const summary = (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>
      {discountTotal > 0 && (
        <div className="flex justify-between font-medium text-red-600"><span>Diskon</span><span>-{rupiah(discountTotal)}</span></div>
      )}
      <div className="flex justify-between text-lg font-extrabold text-slate-900"><span>Total</span><span>{rupiah(total)}</span></div>
    </div>
  )

  const paymentFields = (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-semibold transition sm:text-sm ${
              method === m.id
                ? 'border-brand-700 bg-brand-50 text-brand-700 ring-1 ring-brand-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <m.icon size={16} /> {m.label}
          </button>
        ))}
      </div>

      {method === 'cash' ? (
        <>
          <MoneyInput className="input" placeholder="Uang diterima, contoh: 50.000" aria-label="Uang diterima" value={paid} onChange={setPaid} />
          <div className="hide-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            {quick.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setPaid(String(v))}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700"
              >
                {v === total ? 'Uang pas' : rupiah(v)}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-sm font-semibold text-slate-900">
            <span>Kembalian</span><span className="text-brand-700">{rupiah(change)}</span>
          </div>
        </>
      ) : (
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-500">
          Pembayaran {method === 'qris' ? 'QRIS' : 'transfer'} dicatat lunas sesuai total.
        </p>
      )}
    </div>
  )

  const payButton = (
    <button className="btn-primary w-full py-3 text-base shadow-sm" disabled={!canPay || busy} onClick={checkout}>
      {busy ? 'Memproses…' : `Bayar ${rupiah(total)}`}
    </button>
  )

  return (
    <div className="app-bg flex h-[100dvh] flex-col bg-slate-50 lg:flex-row">
      {/* Kiri: produk */}
      <section className="flex min-h-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
          <Link to="/dashboard" className="btn-ghost shrink-0 !px-2" aria-label="Kembali ke dashboard"><ArrowLeft size={18} /></Link>
          <div className="min-w-0 flex-1 lg:flex-none">
            <p className="truncate font-bold leading-tight text-slate-900">Kasir <span className="hidden sm:inline">— {store.name}</span></p>
            <p className="truncate text-xs text-slate-500"><span className="sm:hidden">{store.name} · </span>Penjualan offline</p>
          </div>
          <div className="relative order-last w-full lg:order-none lg:ml-auto lg:max-w-xs">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input className="input pl-9" placeholder="Cari produk…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </header>

        <div className="hide-scrollbar flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
          {[{ id: 'all', name: 'Semua' }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${cat === c.id ? 'bg-brand-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* pb-28 di mobile memberi ruang untuk bar keranjang di bawah */}
        <div className="flex-1 overflow-y-auto p-3 pb-28 sm:p-4 lg:pb-4">
          {filtered.length === 0 ? (
            <EmptyState title="Produk tidak ditemukan" desc="Tambahkan produk di Dashboard › Produk." />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => {
                const d = getDiscountedPrice(p, discounts)
                const out = p.stock <= 0
                const qty = inCart[p.id]
                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:shadow-md ${
                      out ? 'opacity-50' : ''
                    } ${qty ? 'border-brand-600 ring-1 ring-brand-600' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    {/* Gambar + nama: ketuk untuk menambah 1 */}
                    <button type="button" disabled={out} onClick={() => add(p)} className="block w-full text-left active:opacity-80 disabled:cursor-not-allowed">
                      <div className="relative aspect-[4/3] bg-slate-100">
                        <ProductImage src={p.image_url} />
                        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 text-[11px] text-white">
                          {out ? 'Habis' : `Stok ${p.stock}`}
                        </span>
                        {d.discount && <span className="absolute left-1 top-1 rounded bg-red-600 px-1.5 text-[11px] font-bold text-white">Promo</span>}
                      </div>
                      <p className="line-clamp-2 min-h-[2.5rem] px-2.5 pt-2.5 text-[13px] font-semibold leading-tight text-slate-900 sm:px-3 sm:text-sm">{p.name}</p>
                    </button>

                    {/* Harga di kiri, jumlah di kanan: muncul setelah produk ditambahkan */}
                    <div className="mt-auto flex items-end justify-between gap-1.5 p-2.5 pt-1 sm:p-3 sm:pt-1">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-brand-700">{rupiah(d.final)}</p>
                        {d.discount && <p className="truncate text-xs text-slate-400 line-through">{rupiah(p.price)}</p>}
                      </div>
                      {qty > 0 ? (
                        <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-brand-500/10 p-0.5">
                          <button
                            type="button"
                            aria-label="Kurangi"
                            onClick={() => setQty(p.id, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm active:scale-90"
                          >
                            {qty === 1 ? <Trash2 size={13} className="text-red-600" /> : <Minus size={13} />}
                          </button>
                          <span className="min-w-5 text-center text-sm font-bold text-brand-700">{qty}</span>
                          <button
                            type="button"
                            aria-label="Tambah"
                            onClick={() => add(p)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-700 text-white shadow-sm active:scale-90"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Tambah ${p.name}`}
                          disabled={out}
                          onClick={() => add(p)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white shadow-sm active:scale-90 disabled:opacity-50"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Kanan (desktop): keranjang */}
      <aside className="hidden w-[400px] shrink-0 flex-col border-l border-slate-200 bg-white lg:flex">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="flex items-center gap-2 font-bold text-slate-900"><ShoppingCart size={18} /> Keranjang</h2>
          {cart.length > 0 && <button className="text-xs text-red-600 hover:text-red-700 hover:underline" onClick={() => setCart([])}>Kosongkan</button>}
        </div>

        <div className="flex-1 overflow-y-auto px-4">{itemsList}</div>

        <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-4">
          {summary}
          {paymentFields}
          {payButton}
        </div>
      </aside>

      {/* Mobile: bar keranjang melayang di bawah, ketuk untuk membuka keranjang & pembayaran */}
      {cart.length > 0 && !sheet.mounted && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 px-3 pt-2 lg:hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
        >
          <button
            type="button"
            onClick={sheet.open}
            className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-4 py-3 text-left text-white shadow-xl shadow-brand-700/30 transition active:scale-[.98]"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ShoppingCart size={20} />
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-brand-700">
                {itemCount}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-white/80">{itemCount} item</span>
              <span className="block text-base font-extrabold leading-tight">{rupiah(total)}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
              Bayar <ChevronUp size={18} />
            </span>
          </button>
        </div>
      )}

      {/* Mobile: bottom sheet keranjang & pembayaran */}
      {sheet.mounted && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ease-out motion-reduce:transition-none ${sheet.shown ? 'opacity-100' : 'opacity-0'}`}
            onClick={sheet.close}
          />
          <div
            className={`absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl transition-transform duration-[350ms] ease-[cubic-bezier(.2,.7,.2,1)] motion-reduce:transition-none ${sheet.shown ? 'translate-y-0' : 'translate-y-full'}`}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-300" />
            <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <ShoppingCart size={18} /> Keranjang
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{itemCount}</span>
              </h2>
              <div className="flex items-center gap-1">
                {cart.length > 0 && (
                  <button type="button" className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/10" onClick={() => setCart([])}>
                    Kosongkan
                  </button>
                )}
                <button type="button" aria-label="Tutup keranjang" className="rounded-full p-2 text-slate-500 hover:bg-slate-100" onClick={sheet.close}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
              {itemsList}
              <div className="mt-2 space-y-4 border-t border-slate-200 pt-4">
                {summary}
                {paymentFields}
              </div>
            </div>

            <div
              className="shrink-0 border-t border-slate-200 bg-white px-4 pt-3"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
            >
              {payButton}
            </div>
          </div>
        </div>
      )}

      <ReceiptModal receipt={receipt} store={store} onClose={() => setReceipt(null)} />
    </div>
  )
}

function ReceiptModal({ receipt, store, onClose }) {
  if (!receipt) return null
  const { tx, lines, method } = receipt
  return (
    <Modal open onClose={onClose} title="Transaksi Berhasil" size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={() => window.print()}><Printer size={16} /> Cetak</button>
          <button className="btn-primary" onClick={onClose}>Transaksi Baru</button>
        </>
      }
    >
      <div id="receipt" className="space-y-3 text-sm">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="text-brand-700" size={36} />
          <p className="mt-1 font-bold text-slate-900">{store.name}</p>
          <p className="text-xs text-slate-500">{tx.invoice_no} · {formatDateTime(tx.created_at)}</p>
        </div>
        <ul className="divide-y divide-dashed divide-slate-200 border-y border-dashed border-slate-200">
          {lines.map((l) => (
            <li key={l.product.id} className="flex justify-between py-2 text-slate-800">
              <span>{l.qty}× {l.product.name}</span><span>{rupiah(l.unit * l.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 text-slate-800">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{rupiah(tx.subtotal)}</span></div>
          {Number(tx.discount_total) > 0 && <div className="flex justify-between text-red-600 font-medium"><span>Diskon</span><span>-{rupiah(tx.discount_total)}</span></div>}
          <div className="flex justify-between font-bold text-slate-900"><span>Total</span><span>{rupiah(tx.total)}</span></div>
          <div className="flex justify-between"><span>Bayar ({method.toUpperCase()})</span><span>{rupiah(tx.paid)}</span></div>
          <div className="flex justify-between"><span>Kembali</span><span>{rupiah(tx.change_amount)}</span></div>
        </div>
        <p className="text-center text-xs text-slate-500">Terima kasih telah berbelanja!</p>
      </div>
    </Modal>
  )
}