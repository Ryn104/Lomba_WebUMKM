import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AlertTriangle, PiggyBank, Save, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { rupiah, todayISO } from '../../../lib/utils'
import MoneyInput from '../../ui/MoneyInput'
import { EXPENSE_CATS, jakartaDate, monthRange } from './financeUtils'

/** Anggaran pengeluaran bulanan per kategori, disimpan di stores.theme.finance_budget. */
export default function Budget({ store, setStore }) {
  const budget = store?.theme?.finance_budget || {}
  const [month, setMonth] = useState(todayISO().slice(0, 7))
  const [spent, setSpent] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const { end } = monthRange(month)
      const { data } = await supabase
        .from('finances')
        .select('category,amount')
        .eq('store_id', store.id)
        .eq('type', 'expense')
        .gte('date', `${month}-01`)
        .lte('date', jakartaDate(end.getTime() - 1))
      if (!alive) return
      const map = {}
      ;(data || []).forEach((row) => {
        map[row.category] = (map[row.category] || 0) + (Number(row.amount) || 0)
      })
      setSpent(map)
    })()
    return () => { alive = false }
  }, [store.id, month])

  const startEditing = () => {
    setDraft(Object.fromEntries(EXPENSE_CATS.map((category) => [category, budget[category] ? String(budget[category]) : ''])))
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const { data: fresh, error } = await supabase.from('stores').select('*').eq('id', store.id).single()
      if (error) throw error
      const cleaned = Object.fromEntries(
        EXPENSE_CATS.map((category) => [category, Number(draft[category]) || 0]).filter(([, value]) => value > 0)
      )
      const nextTheme = { ...(fresh.theme || {}), finance_budget: cleaned }
      const { data: updated, error: updateError } = await supabase
        .from('stores')
        .update({ theme: nextTheme })
        .eq('id', store.id)
        .select()
        .single()
      if (updateError) throw updateError
      setStore(updated)
      setEditing(false)
      toast.success('Anggaran pengeluaran disimpan.')
    } catch (error) {
      toast.error(`Anggaran gagal disimpan: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const rows = EXPENSE_CATS.filter((category) => Number(budget[category]) > 0).map((category) => {
    const limit = Number(budget[category]) || 0
    const used = spent?.[category] || 0
    const percent = limit > 0 ? (used / limit) * 100 : 0
    return { category, limit, used, percent }
  })
  const totalLimit = rows.reduce((total, row) => total + row.limit, 0)
  const totalUsed = rows.reduce((total, row) => total + row.used, 0)

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Anggaran Pengeluaran</h3>
          <p className="mt-0.5 text-xs text-slate-500">Tetapkan batas bulanan per kategori dan pantau pemakaiannya.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="input w-auto py-1.5 text-xs" />
          {!editing ? (
            <button type="button" onClick={startEditing} className="btn-secondary px-3 py-1.5 text-xs font-semibold">
              Atur anggaran
            </button>
          ) : (
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost px-2 py-1.5 text-xs font-semibold text-slate-500">
              <X size={14} /> Batal
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {EXPENSE_CATS.map((category) => (
              <label key={category} className="block">
                <span className="label text-xs">{category}</span>
                <MoneyInput
                  value={draft[category] || ''}
                  onChange={(value) => setDraft((current) => ({ ...current, [category]: value }))}
                  placeholder="0"
                  className="input"
                />
              </label>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Kosongkan atau isi 0 untuk tidak memakai anggaran pada kategori tersebut.</p>
          <button type="button" onClick={save} disabled={saving} className="btn-primary px-4 py-2 text-sm font-bold">
            <Save size={15} /> {saving ? 'Menyimpan…' : 'Simpan anggaran'}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
          <PiggyBank size={30} className="mb-2 text-slate-400" />
          <p className="text-sm font-semibold text-slate-800">Belum ada anggaran</p>
          <p className="mt-1 max-w-sm text-xs text-slate-500">Atur batas bulanan per kategori agar pengeluaran toko lebih terkendali.</p>
          <button type="button" onClick={startEditing} className="btn-primary mt-4 px-4 py-2 text-xs font-bold">
            Atur anggaran
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs">
            <span className="font-semibold text-slate-700">Total anggaran bulan ini</span>
            <span className="font-bold text-slate-900">
              {rupiah(totalUsed)} <span className="font-medium text-slate-500">/ {rupiah(totalLimit)}</span>
            </span>
          </div>

          {rows.map((row) => {
            const over = row.percent > 100
            const warning = row.percent > 80 && !over
            const barColor = over ? 'bg-red-600' : warning ? 'bg-amber-500' : 'bg-brand-600'
            return (
              <div key={row.category}>
                <div className="flex flex-wrap items-baseline justify-between gap-1 text-xs">
                  <span className="font-semibold text-slate-700">{row.category}</span>
                  <span className={`font-semibold ${over ? 'text-red-700' : warning ? 'text-amber-700' : 'text-slate-700'}`}>
                    {rupiah(row.used)} / {rupiah(row.limit)} · {row.percent.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${Math.min(row.percent, 100)}%` }} />
                </div>
                {(over || warning) && (
                  <p className={`mt-1 inline-flex items-center gap-1 text-[11px] font-medium ${over ? 'text-red-700' : 'text-amber-700'}`}>
                    <AlertTriangle size={11} />
                    {over ? `Anggaran terlampaui ${rupiah(row.used - row.limit)}` : 'Pemakaian di atas 80% anggaran'}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
