import { Sparkles, Info, ShoppingBag, Images, MessageSquareQuote, Phone } from 'lucide-react'

/**
 * Metadata Layout Variant per section (tersimpan di content.layout).
 * Urutan = urutan tampil di LayoutPicker builder.
 */
export const LAYOUT_OPTIONS = {
  hero: [
    { id: 'split', label: 'Split Hero' },
    { id: 'full', label: 'Full Image Hero' },
    { id: 'center', label: 'Centered Hero' },
    { id: 'asym', label: 'Asymmetric Hero' },
  ],
  about: [
    { id: 'two', label: 'Two Column' },
    { id: 'bgimage', label: 'Image Background' },
    { id: 'editorial', label: 'Editorial Layout' },
  ],
  products: [
    { id: 'grid', label: 'Standard Product Grid' },
    { id: 'featured', label: 'Featured Product' },
    { id: 'horizontal', label: 'Horizontal Product List' },
    { id: 'compact', label: 'Compact Product Cards' },
  ],
  gallery: [
    { id: 'uniform', label: 'Uniform Grid' },
    { id: 'masonry', label: 'Masonry Grid' },
    { id: 'collage', label: 'Asymmetric Collage' },
  ],
  testimonials: [
    { id: 'cards', label: 'Testimonial Cards' },
    { id: 'carousel', label: 'Carousel' },
    { id: 'featured', label: 'Featured Testimonial' },
  ],
  contact: [
    { id: 'split', label: 'Split Contact Layout' },
    { id: 'centered', label: 'Centered Contact' },
    { id: 'cards', label: 'Contact Information Cards' },
  ],
  header: [
    { id: 'split', label: 'Split Navigation' },
    { id: 'center', label: 'Centered Navigation' },
    { id: 'minimal', label: 'Minimal Navigation' },
  ],
  footer: [
    { id: 'minimal', label: 'Minimal Footer' },
    { id: 'multi', label: 'Multi-column' },
    { id: 'branded', label: 'Branded Footer' },
  ],
}

/** Layout default jika section belum punya pilihan (data lama / compatibilitas). */
export const DEFAULT_LAYOUTS = {
  hero: 'center',
  about: 'two',
  products: 'grid',
  gallery: 'uniform',
  testimonials: 'cards',
  contact: 'split',
  header: 'split',
  footer: 'minimal',
}

export const layoutLabel = (type, id) =>
  LAYOUT_OPTIONS[type]?.find((l) => l.id === id)?.label || id || 'Default'

/** Definisi semua section yang bisa dipakai di web builder */
export const SECTION_TYPES = {
  hero: {
    label: 'Hero',
    icon: Sparkles,
    defaults: {
      title: 'Selamat Datang di Toko Kami',
      subtitle: 'Produk berkualitas langsung dari UMKM lokal',
      buttonText: 'Lihat Produk',
      image: '',
      bg: '#047857',
      textColor: '#ffffff',
      align: 'center',
    },
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'subtitle', label: 'Sub judul', type: 'textarea' },
      { key: 'buttonText', label: 'Teks tombol', type: 'text' },
      { key: 'image', label: 'Gambar latar', type: 'image' },
      { key: 'bg', label: 'Warna latar', type: 'color' },
      { key: 'textColor', label: 'Warna teks', type: 'color' },
      { key: 'align', label: 'Posisi teks', type: 'select', options: [['left', 'Kiri'], ['center', 'Tengah']] },
    ],
  },
  about: {
    label: 'Tentang Kami',
    icon: Info,
    defaults: {
      title: 'Tentang Kami',
      text: 'Ceritakan kisah usaha Anda di sini: sejarah, nilai, dan keunggulan produk Anda.',
      image: '',
      bg: '#ffffff',
      textColor: '#1e293b',
      imageSide: 'right',
    },
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'text', label: 'Deskripsi', type: 'textarea' },
      { key: 'image', label: 'Gambar', type: 'image' },
      { key: 'imageSide', label: 'Posisi gambar', type: 'select', options: [['right', 'Kanan'], ['left', 'Kiri']] },
      { key: 'bg', label: 'Warna latar', type: 'color' },
      { key: 'textColor', label: 'Warna teks', type: 'color' },
    ],
  },
  products: {
    label: 'Produk',
    icon: ShoppingBag,
    defaults: {
      title: 'Produk Kami',
      subtitle: 'Pilihan terbaik untuk Anda',
      columns: 3,
      limit: 8,
      bg: '#f8fafc',
      textColor: '#1e293b',
    },
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'subtitle', label: 'Sub judul', type: 'text' },
      { key: 'columns', label: 'Jumlah kolom', type: 'select', options: [[2, '2'], [3, '3'], [4, '4']], number: true },
      { key: 'limit', label: 'Maks. produk ditampilkan', type: 'number' },
      { key: 'bg', label: 'Warna latar', type: 'color' },
      { key: 'textColor', label: 'Warna teks', type: 'color' },
    ],
    note: 'Produk diambil otomatis dari Dashboard Toko.',
  },
  gallery: {
    label: 'Galeri',
    icon: Images,
    defaults: {
      title: 'Galeri',
      images: [],
      bg: '#ffffff',
      textColor: '#1e293b',
    },
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'images', label: 'Foto galeri', type: 'images' },
      { key: 'bg', label: 'Warna latar', type: 'color' },
      { key: 'textColor', label: 'Warna teks', type: 'color' },
    ],
  },
  testimonials: {
    label: 'Testimoni',
    icon: MessageSquareQuote,
    defaults: {
      title: 'Kata Pelanggan',
      items: [
        { name: 'Budi', text: 'Produknya bagus dan pelayanan ramah!' },
        { name: 'Sari', text: 'Pengiriman cepat, pasti beli lagi.' },
      ],
      bg: '#ecfdf5',
      textColor: '#1e293b',
    },
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'items', label: 'Testimoni', type: 'testimonials' },
      { key: 'bg', label: 'Warna latar', type: 'color' },
      { key: 'textColor', label: 'Warna teks', type: 'color' },
    ],
  },
  contact: {
    label: 'Kontak',
    icon: Phone,
    defaults: {
      title: 'Hubungi Kami',
      address: 'Jl. Contoh No. 1, Bandung',
      phone: '',
      email: '',
      hours: 'Setiap hari 08.00 - 20.00',
      lat: null,
      lng: null,
      mapUrl: '',
      bg: '#1e293b',
      textColor: '#ffffff',
    },
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'address', label: 'Alamat', type: 'textarea' },
      { key: 'phone', label: 'No. WhatsApp (628xxx)', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'hours', label: 'Jam buka', type: 'text' },
      {
        key: 'location',
        label: 'Titik Lokasi Toko (opsional, paling presisi)',
        type: 'location',
        hint: "Klik 'Pilih Lokasi' untuk menandai titik toko di peta. Jika tidak diisi (dan URL Embed di bawah juga kosong), peta tidak akan ditampilkan di website.",
      },
      {
        key: 'mapUrl',
        label: 'Atau URL Embed Google Maps (opsional)',
        type: 'text',
        hint: 'Alternatif lain selain titik lokasi di atas — ambil dari Google Maps > Bagikan > Sematkan peta, lalu salin URL di dalam src="...".',
      },
      { key: 'bg', label: 'Warna latar', type: 'color' },
      { key: 'textColor', label: 'Warna teks', type: 'color' },
    ],
  },
}

export const defaultSections = () =>
  ['hero', 'about', 'products', 'contact'].map((type, i) => ({
    id: crypto.randomUUID(),
    type,
    position: i,
    content: { ...SECTION_TYPES[type].defaults },
  }))
