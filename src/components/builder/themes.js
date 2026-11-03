/**
 * Empat tema bawaan Web Builder (gratis, sesuai hak akses paket yang berlaku).
 * Tema hanya mengatur warna utama (primary), nuansa huruf (font), dan label mode
 * pada store.theme — tidak menambah biaya, tabel, atau konten baru.
 */
export const BUILDER_THEMES = [
  {
    id: 'elegan',
    name: 'Elegan',
    badge: 'Minimalis',
    desc: 'Bersih, rapi, dan berfokus pada produk — pilihan aman untuk semua jenis bisnis.',
    suitedFor: 'katalog produk, jasa, dan UMKM modern',
    primary: '#047857',
    soft: '#ECFDF5',
    font: 'Inter',
    deco: 'minimal',
  },
  {
    id: 'alami',
    name: 'Alami',
    badge: 'Natural',
    desc: 'Nuansa earthy yang hangat dan dekat dengan keseharian pelanggan.',
    suitedFor: 'kopi, makanan rumahan, produk segar',
    primary: '#4D7C0F',
    soft: '#F7FEE7',
    font: 'Verdana',
    deco: 'organic',
  },
  {
    id: 'premium',
    name: 'Premium',
    badge: 'Premium',
    desc: 'Kesan eksklusif dengan aksen emas dan tipografi serif yang berkelas.',
    suitedFor: 'fashion eksklusif, perhiasan, hadiah premium',
    primary: '#A16207',
    soft: '#FFFBEB',
    font: 'Georgia',
    deco: 'gold',
  },
  {
    id: 'kreatif',
    name: 'Kreatif',
    badge: 'Creative',
    desc: 'Warna berani untuk brand yang ingin tampil berbeda dan playful.',
    suitedFor: 'kerajinan tangan, aksesoris, brand muda',
    primary: '#7C3AED',
    soft: '#F3EFFF',
    font: 'Trebuchet MS',
    deco: 'burst',
  },
]

/** Tema aktif toko: berdasarkan mode pilihan pengguna, atau fallback dari warna primary tersimpan. */
export function findActiveTheme(store) {
  if (!store) return null
  const mode = store.theme?.mode
  if (mode) return BUILDER_THEMES.find((t) => t.id === mode) || null
  const primary = (store.theme?.primary || '#047857').toLowerCase()
  return BUILDER_THEMES.find((t) => t.primary.toLowerCase() === primary) || null
}