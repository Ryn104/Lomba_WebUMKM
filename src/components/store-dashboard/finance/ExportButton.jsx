import { useState } from 'react'
import { ChevronDown, FileSpreadsheet } from 'lucide-react'
import { downloadCsv, jakartaDateTime } from './financeUtils'

const slugifyFilename = (value = '') =>
  value.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'toko'

/** Tombol ekspor CSV: laporan laba rugi, transaksi, dan pengeluaran. */
export default function ExportButton({ report, periodLabel, storeName = '', periodKey = '' }) {
  const [open, setOpen] = useState(false)
  const safeName = slugifyFilename(storeName)
  const suffix = periodKey || 'periode'

  const exportProfitLoss = () => {
    const rows = [
      ['Laporan Laba Rugi', storeName],
      ['Periode', periodLabel],
      [],
      ['Komponen', 'Jumlah (Rp)', 'Periode sebelumnya (Rp)'],
      ['Pendapatan penjualan', report.revenue, report.previousRevenue],
      ['Harga Pokok Penjualan (HPP)', report.hpp, report.previousHpp],
      ['Laba kotor', report.gross, report.previousGross],
      ...report.expenseByCategory.map((row) => [`Pengeluaran: ${row.category}`, row.amount, '']),
      ['Total pengeluaran operasional', report.opex, report.previousOpex],
      ['Laba bersih', report.net, report.previousNet],
    ]
    downloadCsv(`laba-rugi-${safeName}-${suffix}.csv`, rows)
    setOpen(false)
  }

  const exportTransactions = () => {
    const rows = [
      ['Invoice', 'Tanggal (WIB)', 'Metode', 'Sumber', 'Subtotal', 'Diskon', 'Total'],
      ...[...report.transactions].reverse().map((row) => [
        row.invoice_no,
        jakartaDateTime(row.created_at),
        row.payment_method,
        row.source,
        Number(row.subtotal) || 0,
        Number(row.discount_total) || 0,
        Number(row.total) || 0,
      ]),
    ]
    downloadCsv(`transaksi-${safeName}-${suffix}.csv`, rows)
    setOpen(false)
  }

  const exportExpenses = () => {
    const rows = [
      ['Tanggal', 'Kategori', 'Catatan', 'Jumlah'],
      ...report.finances
        .filter((row) => row.type === 'expense')
        .map((row) => [row.date, row.category, row.note || '', Number(row.amount) || 0]),
    ]
    downloadCsv(`pengeluaran-${safeName}-${suffix}.csv`, rows)
    setOpen(false)
  }

  const options = [
    { label: 'Laporan laba rugi', onClick: exportProfitLoss },
    { label: 'Daftar transaksi', onClick: exportTransactions },
    { label: 'Daftar pengeluaran', onClick: exportExpenses },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="btn-primary px-3.5 py-2 text-xs font-bold shadow-sm"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <FileSpreadsheet size={15} /> Ekspor CSV <ChevronDown size={13} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg" role="menu">
            {options.map((option) => (
              <button
                key={option.label}
                type="button"
                role="menuitem"
                onClick={option.onClick}
                className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
