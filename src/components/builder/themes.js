/**
 * Empat tema bawaan Web Builder berdasarkan kategori bisnis UMKM (gratis, sesuai hak akses).
 *
 * Setiap tema menentukan:
 *  - identitas visual: warna utama (primary), warna lembut (soft), nuansa huruf (font)
 *  - kombinasi LAYOUT VARIANT default untuk tiap section (layouts)
 *
 * Layout variant adalah struktur/komposisi section — dikustomisasi per section oleh
 * pengguna lewat editor (SectionEditor -> LayoutPicker) dan disimpan di content.layout.
 */
import { DEFAULT_LAYOUTS } from '../store-front/sectionDefs'

export const BUILDER_THEMES = [
  {
    id: 'fashion',
    name: 'Fashion & Lifestyle',
    desc: 'Layout editorial dengan visual produk dominan, hero besar, dan tipografi elegan.',
    suitedFor: 'fashion, pakaian, kosmetik, aksesoris, dan produk lifestyle',
    primary: '#9F1239',
    soft: '#FDF2F8',
    font: 'Georgia',
    layouts: { hero: 'asym', about: 'editorial', products: 'featured', gallery: 'masonry', testimonials: 'featured', contact: 'split', header: 'minimal', footer: 'multi' },
  },
  {
    id: 'fnb',
    name: 'Food & Beverage',
    desc: 'Visual makanan dominan, menu unggulan, kategori produk, dan ajakan pemesanan.',
    suitedFor: 'restoran, cafe, bakery, makanan, dan minuman',
    primary: '#B45309',
    soft: '#FFF7ED',
    font: 'Trebuchet MS',
    layouts: { hero: 'full', about: 'two', products: 'grid', gallery: 'uniform', testimonials: 'carousel', contact: 'cards', header: 'center', footer: 'branded' },
  },
  {
    id: 'beauty',
    name: 'Beauty & Wellness',
    desc: 'Layout bersih dan storytelling dengan highlight produk serta manfaat yang jelas.',
    suitedFor: 'skincare, body care, herbal, produk kesehatan nonmedis, dan wellness',
    primary: '#0F766E',
    soft: '#F0FDFA',
    font: 'Verdana',
    layouts: { hero: 'split', about: 'bgimage', products: 'compact', gallery: 'uniform', testimonials: 'cards', contact: 'centered', header: 'split', footer: 'minimal' },
  },
  {
    id: 'creative',
    name: 'Creative & General Business',
    desc: 'Layout dinamis dengan showcase visual, grid fleksibel, dan komposisi asimetris.',
    suitedFor: 'kerajinan tangan, aksesoris, retail, bisnis kreatif, dan usaha umum',
    primary: '#6D28D9',
    soft: '#F5F3FF',
    font: 'Inter',
    layouts: { hero: 'center', about: 'two', products: 'grid', gallery: 'collage', testimonials: 'carousel', contact: 'split', header: 'split', footer: 'multi' },
  },
]

/** Mapping tema lama (estetika umum) -> kategori bisnis terdekat, untuk migrasi tanpa kehilangan data. */
export const LEGACY_THEME_MAP = {
  elegan: 'creative',
  alami: 'fnb',
  premium: 'fashion',
  kreatif: 'creative',
}

/** Preset aktif toko: bekas mode lama dimigrasikan, fallback dari warna primary tersimpan. */
export function findActiveTheme(store) {
  if (!store) return null
  const raw = store.theme || {}
  const mode = LEGACY_THEME_MAP[raw.mode] || raw.mode
  if (mode) return BUILDER_THEMES.find((t) => t.id === mode) || null
  const primary = (raw.primary || '#047857').toLowerCase()
  return BUILDER_THEMES.find((t) => t.primary.toLowerCase() === primary) || null
}

/**
 * Resolve semua konsep terpisah dari store.theme:
 *  - preset: tema kategori aktif (atau null jika warna kustom)
 *  - primary / font: identitas visual efektif
 *  - layouts + headerLayout + footerLayout: kombinasi layout efektif
 */
export function resolveTheme(store = {}) {
  const raw = store.theme || {}
  const preset = findActiveTheme(store)
  const primary = raw.primary || preset?.primary || '#047857'
  const font = raw.font || preset?.font || 'Inter'
  const layouts = { ...DEFAULT_LAYOUTS, ...(preset?.layouts || {}) }
  return {
    preset,
    primary,
    font,
    layouts,
    headerLayout: raw.headerLayout || layouts.header,
    footerLayout: raw.footerLayout || layouts.footer,
  }
}
