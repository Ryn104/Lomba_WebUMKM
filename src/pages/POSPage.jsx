import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart, Banknote, QrCode, Landmark, Printer, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useMyStore } from '../hooks/useMyStore'
import { rupiah, getDiscountedPrice, formatDateTime } from '../lib/utils'
import { Spinner, EmptyState } from '../components/ui/Field'
import Modal from '../components/ui/Modal'
import CreateStore from '../components/builder/CreateStore'

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
    load() // refresh stok
  }

  if (loading) return <Spinner full />

  return (
    <div className="flex h-screen flex-col bg-slate-50 lg:flex-row">
      {/* Kiri: produk */}
      <section className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <Link to="/dashboard" className="btn-ghost px-2"><ArrowLeft size={18} /></Link>
          <div>
            <p className="font-bold leading-tight text-slate-900">Kasir — {store.name}</p>
            <p className="text-xs text-slate-500">Penjualan offline</p>
          </div>
          <div className="relative ml-auto w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input className="input pl-9" placeholder="Cari produk…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2">
          {[{ id: 'all', name: 'Semua' }, ...categories].map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`shrink-0 rounded-full px-3.5 py-1 text-sm font-medium transition ${cat === c.id ? 'bg-brand-700 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <EmptyState title="Produk tidak ditemukan" desc="Tambahkan produk di Dashboard › Produk." />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => {
                const d = getDiscountedPrice(p, discounts)
                const out = p.stock <= 0
                return (
                  <button
                    key={p.id}
                    disabled={out}
                    onClick={() => add(p)}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[.98] disabled:opacity-50"
                  >
                    <div className="relative aspect-[4/3] bg-slate-100">
                      {p.image_url && <img src={p.image_url} alt="" className="h-full w-full object-cover" />}
                      <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 text-xs text-white">Stok {p.stock}</span>
                      {d.discount && <span className="absolute left-1 top-1 rounded bg-red-600 px-1.5 text-xs font-bold text-white">Promo</span>}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">{p.name}</p>
                      <p className="mt-1 text-sm font-bold text-brand-700">{rupiah(d.final)}</p>
                      {d.discount && <p className="text-xs text-slate-400 line-through">{rupiah(p.price)}</p>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Kanan: keranjang */}
      <aside className="flex max-h-[55vh] w-full flex-col border-t border-slate-200 bg-white lg:max-h-none lg:w-[400px] lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="flex items-center gap-2 font-bold text-slate-900"><ShoppingCart size={18} /> Keranjang</h2>
          {cart.length > 0 && <button className="text-xs text-red-600 hover:text-red-700 hover:underline" onClick={() => setCart([])}>Kosongkan</button>}
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {lines.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">Ketuk produk untuk menambahkan.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lines.map((l) => (
                <li key={l.product.id} className="py-3">
                  <div className="flex justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">{l.product.name}</p>
                    <b className="text-sm text-slate-900">{rupiah(l.unit * l.qty)}</b>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {rupiah(l.unit)} {l.label && <span className="text-red-600 font-medium">· {l.label}</span>}
                    </p>
                    <div className="flex items-center gap-1">
                      <button className="rounded border border-slate-200 p-1 hover:bg-slate-50" onClick={() => setQty(l.product.id, -1)}>
                        {l.qty === 1 ? <Trash2 size={13} className="text-red-600" /> : <Minus size={13} />}
                      </button>
                      <span className="w-7 text-center text-sm font-semibold text-slate-800">{l.qty}</span>
                      <button className="rounded border border-slate-200 p-1 hover:bg-slate-50" onClick={() => setQty(l.product.id, 1)}><Plus size={13} /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-4">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>
            {discountTotal > 0 && <div className="flex justify-between text-red-600 font-medium"><span>Diskon</span><span>-{rupiah(discountTotal)}</span></div>}
            <div className="flex justify-between text-lg font-extrabold text-slate-900"><span>Total</span><span>{rupiah(total)}</span></div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-semibold transition ${method === m.id ? 'border-brand-700 bg-brand-50 text-brand-700 ring-1 ring-brand-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                <m.icon size={16} /> {m.label}
              </button>
            ))}
          </div>

          {method === 'cash' && (
            <>
              <input type="number" className="input" placeholder="Uang diterima" value={paid} onChange={(e) => setPaid(e.target.value)} />
              <div className="flex flex-wrap gap-1.5">
                {quick.map((v) => (
                  <button key={v} onClick={() => setPaid(String(v))} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-brand-600 hover:text-brand-700">
                    {v === total ? 'Uang pas' : rupiah(v)}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-900"><span>Kembalian</span><span className="text-brand-700">{rupiah(change)}</span></div>
            </>
          )}

          <button className="btn-primary w-full py-3 text-base shadow-sm" disabled={!canPay || busy} onClick={checkout}>
            {busy ? 'Memproses…' : `Bayar ${rupiah(total)}`}
          </button>
        </div>
      </aside>

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
