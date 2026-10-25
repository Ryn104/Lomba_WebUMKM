import { Sparkles, Info, ShoppingBag, Images, MessageSquareQuote, Phone } from 'lucide-react'

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
      bg: '#4f46e5',
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
      bg: '#eef2ff',
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
      { key: 'mapUrl', label: 'URL Embed Google Maps (opsional)', type: 'text' },
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
    is_visible: true,
  }))
