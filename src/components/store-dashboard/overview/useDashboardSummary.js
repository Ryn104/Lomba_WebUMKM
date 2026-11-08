import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { rupiah } from '../../../lib/utils'
import { pctChange } from '../finance/financeUtils'

/**
 * Data Ringkasan dashboard toko: penjualan bulan ini, transaksi, produk terjual,
 * laba bersih, deret grafik 7/30 hari, metode pembayaran, pesanan terbaru,
 * produk terlaris, stok menipis, dan notifikasi aktivitas.
 * Semua angka berasal dari tabel transactions / transaction_items / finances / products.
 */

const DAY_MS = 86400000

const PAYMENT_LABEL = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' }
const PAYMENT_COLOR = { cash: '#047857', qris: '#10b981', transfer: '#0d9488' }

const sum = (rows, getValue) => rows.reduce((total, row) => total + (Number(getValue(row)) || 0), 0)

/** Tanggal lokal YYYY-MM-DD (kolom `date` pada tabel finances). */
const isoDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const startOfDay = (value) => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

export const paymentLabel = (method) => PAYMENT_LABEL[method] || 'Tunai'

export function useDashboardSummary(storeId) {
  const [state, setState] = useState({ loading: true, error: null, data: null })

  useEffect(() => {
    if (!storeId) return undefined
    let alive = true
    setState((current) => ({ ...current, loading: true, error: null }))

    ;(async () => {
      const now = new Date()
      const today = startOfDay(now)
      const tomorrow = new Date(today.getTime() + DAY_MS)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const itemsFrom = new Date(today.getTime() - 29 * DAY_MS)

      const [prodRes, txRes, itemRes, finRes, recentRes] = await Promise.all([
        supabase.from('products').select('id,name,stock,image_url,price').eq('store_id', storeId),
        supabase
          .from('transactions')
          .select('id,invoice_no,total,payment_method,source,created_at')
          .eq('store_id', storeId)
          .gte('created_at', prevMonthStart.toISOString())
          .order('created_at', { ascending: false }),
        supabase
          .from('transaction_items')
          .select('product_id,product_name,qty,subtotal,transactions!inner(store_id,created_at)')
          .eq('transactions.store_id', storeId)
          .gte('transactions.created_at', new Date(Math.min(itemsFrom.getTime(), monthStart.getTime())).toISOString()),
        supabase
          .from('finances')
          .select('type,amount,date')
          .eq('store_id', storeId)
          .gte('date', isoDate(prevMonthStart)),
        supabase
          .from('transactions')
          .select('id,invoice_no,total,payment_method,source,created_at')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      const error = prodRes.error || txRes.error || itemRes.error || finRes.error || recentRes.error
      if (error) {
        if (alive) setState({ loading: false, error, data: null })
        return
      }

      const products = prodRes.data || []
      const transactions = txRes.data || []
      const items = itemRes.data || []
      const finances = finRes.data || []

      // ---------- Bulan ini vs bulan lalu ----------
      const inRange = (iso, from, to) => {
        const time = new Date(iso).getTime()
        return time >= from.getTime() && time < to.getTime()
      }
      const monthTx = transactions.filter((row) => inRange(row.created_at, monthStart, tomorrow))
      const prevMonthTx = transactions.filter((row) => inRange(row.created_at, prevMonthStart, monthStart))

      const salesTotal = sum(monthTx, (row) => row.total)
      const prevSalesTotal = sum(prevMonthTx, (row) => row.total)
      const txCount = monthTx.length
      const prevTxCount = prevMonthTx.length

      const itemDate = (row) => new Date(row.transactions?.created_at || 0)
      const periodItems = items.filter((row) => itemDate(row) >= itemsFrom && itemDate(row) < tomorrow)
      const soldQty = sum(periodItems, (row) => row.qty)

      const monthFin = finances.filter((row) => row.date >= isoDate(monthStart))
      const prevFin = finances.filter((row) => row.date >= isoDate(prevMonthStart) && row.date < isoDate(monthStart))
      const netProfit = sum(monthFin.filter((r) => r.type === 'income'), (r) => r.amount) - sum(monthFin.filter((r) => r.type === 'expense'), (r) => r.amount)
      const prevNetProfit = sum(prevFin.filter((r) => r.type === 'income'), (r) => r.amount) - sum(prevFin.filter((r) => r.type === 'expense'), (r) => r.amount)

      // ---------- Deret grafik penjualan ----------
      const sumBetween = (from, to) => sum(transactions.filter((row) => inRange(row.created_at, from, to)), (row) => row.total)

      const buildChart = (days) => {
        const series = []
        for (let i = days - 1; i >= 0; i -= 1) {
          const from = new Date(today.getTime() - i * DAY_MS)
          const to = new Date(from.getTime() + DAY_MS)
          series.push({
            label: from.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
            omzet: sumBetween(from, to),
          })
        }
        const rangeFrom = new Date(today.getTime() - (days - 1) * DAY_MS)
        const prevFrom = new Date(rangeFrom.getTime() - days * DAY_MS)
        const total = sumBetween(rangeFrom, tomorrow)
        return { series, total, growth: pctChange(total, sumBetween(prevFrom, rangeFrom)) }
      }

      // ---------- Metode pembayaran bulan ini ----------
      const methodMap = new Map()
      monthTx.forEach((row) => {
        const key = row.payment_method || 'cash'
        methodMap.set(key, (methodMap.get(key) || 0) + (Number(row.total) || 0))
      })
      const sources = [...methodMap.entries()]
        .map(([key, value]) => ({
          key,
          name: paymentLabel(key),
          value,
          share: salesTotal ? (value / salesTotal) * 100 : 0,
          color: PAYMENT_COLOR[key] || '#64748b',
        }))
        .sort((a, b) => b.value - a.value)

      // ---------- Produk terlaris 30 hari ----------
      const productImage = new Map(products.map((product) => [product.id, product.image_url]))
      const productMap = new Map()
      periodItems.forEach((row) => {
        const key = row.product_id || row.product_name
        const entry = productMap.get(key) || {
          key,
          name: row.product_name,
          image: row.product_id ? productImage.get(row.product_id) : null,
          qty: 0,
          revenue: 0,
        }
        entry.qty += Number(row.qty) || 0
        entry.revenue += Number(row.subtotal) || 0
        productMap.set(key, entry)
      })
      const topProducts = [...productMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)

      // ---------- Stok menipis & notifikasi ----------
      const lowStock = products.filter((product) => Number(product.stock) <= 5).sort((a, b) => a.stock - b.stock)
      const recent = recentRes.data || []

      const notifications = [
        ...recent.slice(0, 3).map((row) => ({
          id: `tx-${row.id}`,
          type: 'sale',
          title: `Pesanan ${row.invoice_no}`,
          desc: `${paymentLabel(row.payment_method)} · ${rupiah(row.total)}`,
          at: row.created_at,
        })),
        ...lowStock.slice(0, 2).map((product) => ({
          id: `stock-${product.id}`,
          type: 'stock',
          title: `Stok "${product.name}" menipis`,
          desc: product.stock === 0 ? 'Stok habis, segera isi ulang' : `Tersisa ${product.stock} pcs`,
          at: null,
        })),
      ]

      const data = {
        stats: {
          sales: { total: salesTotal, growth: pctChange(salesTotal, prevSalesTotal) },
          orders: { total: txCount, growth: pctChange(txCount, prevTxCount) },
          sold: { total: soldQty },
          profit: { total: netProfit, growth: pctChange(netProfit, prevNetProfit) },
        },
        chart: { 7: buildChart(7), 30: buildChart(30) },
        sources,
        salesTotal,
        recent,
        topProducts,
        lowStock,
        notifications,
        productCount: products.length,
      }

      if (alive) setState({ loading: false, error: null, data })
    })()

    return () => {
      alive = false
    }
  }, [storeId])

  return state
}
