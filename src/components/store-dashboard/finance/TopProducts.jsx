import { AlertTriangle, PackageSearch } from 'lucide-react'
import { rupiah } from '../../../lib/utils'

/** Tabel 10 produk terlaris beserta laba dan margin per produk. */
export default function TopProducts({ report }) {
  const rows = report.topByQty

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">Produk Terlaris & Margin</h3>
          <p className="mt-0.5 text-xs text-slate-500">10 produk teratas berdasarkan jumlah terjual pada periode ini.</p>
        </div>
        {report.missingCostCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            <AlertTriangle size={12} /> {report.missingCostCount} produk tanpa harga modal
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <PackageSearch size={32} className="mb-2 text-slate-400" />
          <p className="text-sm font-semibold text-slate-800">Belum ada penjualan produk</p>
          <p className="mt-1 max-w-sm text-xs text-slate-500">Data produk terlaris muncul setelah ada transaksi pada periode ini.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3 text-right">Terjual</th>
                <th className="px-4 py-3 text-right">Omzet</th>
                <th className="px-4 py-3 text-right">Laba</th>
                <th className="px-4 py-3 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const lowMargin = row.margin !== null && row.margin < 15
                return (
                  <tr key={row.key} className="hover:bg-slate-50/70">
                    <td className="max-w-[16rem] px-4 py-3">
                      <p className="truncate font-medium text-slate-800">{row.name}</p>
                      {!row.costKnown && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                          <AlertTriangle size={10} /> Lengkapi harga modal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{row.qty}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{rupiah(row.revenue)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${row.profit >= 0 ? 'text-brand-700' : 'text-red-700'}`}>{rupiah(row.profit)}</td>
                    <td className="px-4 py-3 text-right">
                      {row.margin === null ? (
                        <span className="text-xs text-slate-400">-</span>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${lowMargin ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
                          {row.margin.toFixed(1)}%
                        </span>
                      )}
                      {lowMargin && <p className="mt-1 text-[10px] text-red-600">Margin rendah</p>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
