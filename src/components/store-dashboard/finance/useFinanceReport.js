import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { DAY_MS, jakartaDate, jakartaHour, jakartaWeekday, pctChange } from './financeUtils'

const sum = (rows, getValue) => rows.reduce((total, row) => total + (Number(getValue(row)) || 0), 0)

/**
 * Ambil data laporan lanjutan untuk satu rentang tanggal.
 * Semua filter tanggal dilakukan di server (transactions.created_at / finances.date),
 * termasuk periode pembanding sebelumnya dengan panjang yang sama.
 */
export function useFinanceReport(storeId, start, end) {
  const [state, setState] = useState({ loading: true, error: null, report: null })
  const startMs = start?.getTime() || 0
  const endMs = end?.getTime() || 0

  useEffect(() => {
    if (!storeId || !startMs || !endMs || endMs <= startMs) return undefined
    let alive = true
    setState((current) => ({ ...current, loading: true, error: null }))

    ;(async () => {
      const span = endMs - startMs
      const prevStartMs = startMs - span
      const fromISO = new Date(prevStartMs).toISOString()
      const toISO = new Date(endMs).toISOString()
      const startDate = jakartaDate(startMs)
      const endDate = jakartaDate(endMs - 1)
      const prevStartDate = jakartaDate(prevStartMs)

      const [txRes, itemRes, finRes, prodRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('id,invoice_no,total,subtotal,discount_total,payment_method,source,created_at')
          .eq('store_id', storeId)
          .gte('created_at', fromISO)
          .lt('created_at', toISO)
          .order('created_at', { ascending: true }),
        supabase
          .from('transaction_items')
          .select('transaction_id,product_id,product_name,qty,price,discount,subtotal,transactions!inner(store_id,created_at)')
          .eq('transactions.store_id', storeId)
          .gte('transactions.created_at', fromISO)
          .lt('transactions.created_at', toISO),
        supabase
          .from('finances')
          .select('id,type,category,amount,date,note,transaction_id')
          .eq('store_id', storeId)
          .gte('date', prevStartDate)
          .lte('date', endDate)
          .order('date', { ascending: true }),
        supabase.from('products').select('id,name,cost_price').eq('store_id', storeId),
      ])

      const error = txRes.error || itemRes.error || finRes.error || prodRes.error
      if (error) {
        if (alive) setState({ loading: false, error, report: null })
        return
      }

      const transactions = txRes.data || []
      const items = itemRes.data || []
      const finances = finRes.data || []
      const products = prodRes.data || []
      const costById = new Map(products.map((product) => [product.id, Number(product.cost_price) || 0]))

      const isCurrent = (iso) => {
        if (!iso) return false
        const time = new Date(iso).getTime()
        return time >= startMs && time < endMs
      }

      const currentTx = transactions.filter((row) => isCurrent(row.created_at))
      const previousTx = transactions.filter((row) => !isCurrent(row.created_at))
      const currentItems = items.filter((row) => isCurrent(row.transactions?.created_at))
      const previousItems = items.filter((row) => !isCurrent(row.transactions?.created_at))
      const currentFin = finances.filter((row) => row.date >= startDate && row.date <= endDate)
      const previousFin = finances.filter((row) => row.date >= prevStartDate && row.date < startDate)

      const revenue = sum(currentTx, (row) => row.total)
      const previousRevenue = sum(previousTx, (row) => row.total)
      const hpp = sum(currentItems, (row) => (Number(row.qty) || 0) * (costById.get(row.product_id) || 0))
      const previousHpp = sum(previousItems, (row) => (Number(row.qty) || 0) * (costById.get(row.product_id) || 0))
      const opex = sum(currentFin.filter((row) => row.type === 'expense'), (row) => row.amount)
      const previousOpex = sum(previousFin.filter((row) => row.type === 'expense'), (row) => row.amount)

      const gross = revenue - hpp
      const previousGross = previousRevenue - previousHpp
      const net = gross - opex
      const previousNet = previousGross - previousOpex

      const expenseMap = new Map()
      currentFin
        .filter((row) => row.type === 'expense')
        .forEach((row) => {
          expenseMap.set(row.category, (expenseMap.get(row.category) || 0) + (Number(row.amount) || 0))
        })
      const expenseByCategory = [...expenseMap.entries()]
        .map(([category, amount]) => ({ category, amount, share: opex ? (amount / opex) * 100 : 0 }))
        .sort((a, b) => b.amount - a.amount)

      const productMap = new Map()
      currentItems.forEach((row) => {
        const key = row.product_id || row.product_name
        const entry = productMap.get(key) || {
          key,
          name: row.product_name,
          qty: 0,
          revenue: 0,
          hpp: 0,
          costKnown: Boolean(row.product_id) && (costById.get(row.product_id) || 0) > 0,
        }
        entry.qty += Number(row.qty) || 0
        entry.revenue += Number(row.subtotal) || 0
        entry.hpp += (Number(row.qty) || 0) * (costById.get(row.product_id) || 0)
        productMap.set(key, entry)
      })
      const productRows = [...productMap.values()].map((row) => {
        const profit = row.revenue - row.hpp
        return { ...row, profit, margin: row.revenue > 0 ? (profit / row.revenue) * 100 : null }
      })
      const topByQty = [...productRows].sort((a, b) => b.qty - a.qty).slice(0, 10)
      const topByProfit = [...productRows].sort((a, b) => b.profit - a.profit).slice(0, 10)

      const hourly = Array.from({ length: 24 }, (_, hour) => ({ jam: `${String(hour).padStart(2, '0')}`, transaksi: 0 }))
      const weekdayMap = new Map()
      currentTx.forEach((row) => {
        const hour = jakartaHour(row.created_at)
        if (Number.isFinite(hour)) hourly[hour].transaksi += 1
        const day = jakartaWeekday(row.created_at)
        weekdayMap.set(day, (weekdayMap.get(day) || 0) + 1)
      })
      const busiestHour = currentTx.length ? hourly.reduce((best, row) => (row.transaksi > best.transaksi ? row : best), hourly[0]) : null
      const busiestDayEntry = [...weekdayMap.entries()].sort((a, b) => b[1] - a[1])[0] || null
      const aov = currentTx.length ? revenue / currentTx.length : 0
      const previousAov = previousTx.length ? previousRevenue / previousTx.length : 0

      const report = {
        startDate,
        endDate,
        prevStartDate,
        transactions: currentTx,
        items: currentItems,
        finances: currentFin,
        previousFinances: previousFin,
        txCount: currentTx.length,
        revenue,
        previousRevenue,
        hpp,
        previousHpp,
        gross,
        previousGross,
        opex,
        previousOpex,
        net,
        previousNet,
        expenseByCategory,
        topByQty,
        topByProfit,
        missingCostCount: topByQty.filter((row) => !row.costKnown).length,
        lowMarginCount: topByQty.filter((row) => row.margin !== null && row.margin < 15).length,
        aov,
        previousAov,
        aovGrowth: pctChange(aov, previousAov),
        hourly,
        busiestHour,
        busiestDay: busiestDayEntry ? { label: busiestDayEntry[0], count: busiestDayEntry[1] } : null,
        revenueGrowth: pctChange(revenue, previousRevenue),
        netGrowth: pctChange(net, previousNet),
        spanDays: Math.round(span / DAY_MS),
      }

      if (alive) setState({ loading: false, error: null, report })
    })()

    return () => { alive = false }
  }, [storeId, startMs, endMs])

  return state
}
