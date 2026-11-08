import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import ModalLayer from '../ui/ModalLayer'

export default function DeleteAccountModal({ profile, stores, deleting, onClose, onConfirm }) {
  const keyword = profile.email || 'HAPUS'
  const [typed, setTyped] = useState('')
  const matches = typed.trim().toLowerCase() === keyword.toLowerCase()

  return (
    <ModalLayer open onClose={onClose} labelledBy="delete-account-title" label="Hapus akun" canClose={!deleting}>
      <form
        className="ad-pop relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault()
          if (matches && !deleting) onConfirm()
        }}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-red-100 p-2.5 text-red-600 ring-4 ring-red-50"><AlertTriangle size={20} /></span>
            <div>
              <h2 id="delete-account-title" className="text-lg font-bold tracking-tight text-slate-900">Hapus akun permanen</h2>
              <p className="mt-1 text-sm text-slate-500">{profile.full_name || '-'} · {profile.email}</p>
            </div>
          </div>
          <button type="button" disabled={deleting} onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 p-6 text-sm text-slate-700">
          <p>Data berikut akan <b>dihapus permanen</b> dan tidak bisa dikembalikan:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Akun login dan profil pengguna</li>
            <li>
              {stores.length === 0
                ? 'Pengguna ini belum memiliki toko'
                : `Website toko: ${stores.map((s) => s.name).join(', ')} (alamat toko tidak bisa diakses lagi)`}
            </li>
            <li>Seluruh produk, kategori, diskon, transaksi kasir, dan catatan keuangan toko</li>
            <li>Semua gambar yang diunggah (logo, produk, foto profil)</li>
          </ul>

          <label className="block">
            <span className="font-semibold text-slate-800">Ketik <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{keyword}</span> untuk konfirmasi</span>
            <input
              className="input mt-2"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={keyword}
              autoComplete="off"
              disabled={deleting}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" disabled={deleting} onClick={onClose} className="btn-secondary !rounded-full">Batal</button>
          <button
            type="submit"
            disabled={!matches || deleting}
            className="inline-flex min-w-36 items-center justify-center rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? 'Menghapus…' : 'Hapus akun'}
          </button>
        </div>
      </form>
    </ModalLayer>
  )
}