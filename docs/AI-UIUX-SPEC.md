# Spesifikasi Produk & UI/UX — UMKM Web Builder

> Dokumen ini ditujukan untuk AI (mis. Figma AI, v0, Galileo, Midjourney, dsb.) sebagai konteks lengkap produk. Gunakan untuk meng-generate desain UI/UX, wireframe, atau mockup.

---

## 1. Ikhtisar Produk

**Nama:** UMKM Builder (UMKM Web Builder)
**Tagline:** "Bikin website toko UMKM Anda dalam hitungan menit"
**Domain platform:** `umkm.rtrwstudio.online` (umum, contoh toko: `umkm.rtrwstudio.online/nama-toko`)

**Deskripsi:** SaaS platform all-in-one untuk pelaku UMKM Indonesia. Satu tempat untuk: membangun website toko tanpa coding (drag & drop builder), mengelola produk & diskon, pencatatan keuangan, dan kasir (POS) untuk penjualan offline.

**Teknologi saat ini (konteks):** React 18 + Vite + Tailwind CSS + Supabase (Auth, Database/RLS, Storage), React Router, dnd-kit (drag & drop), Recharts (grafik), react-hot-toast (notifikasi), Lucide (ikon).

**Persona pengguna:**

1. **Pemilik UMKM (role `umkm`)** — pengguna utama: pemilik toko makanan, fashion, kerajinan, jasa, dsb. Umumnya non-teknis, akses dari HP maupun desktop.
2. **Admin Platform (role `admin`)** — pengelola SaaS: memantau dan mengelola semua toko.

**Bahasa UI:** Indonesia.
**Tone desain:** bersih, ramah, modern, "local & trustworthy". Warna utama saat ini indigo `#4f46e5` (brand), aksen amber untuk status "Draft", netral slate untuk teks.

---

## 2. Peta Halaman & Rute

| Rute                    | Halaman                     | Akses        | Deskripsi                                                   |
| ----------------------- | --------------------------- | ------------ | ----------------------------------------------------------- |
| `/`                     | Landing Page                | Publik       | Halaman pemasaran platform                                  |
| `/login`                | Login                       | Publik       | Masuk (email + password)                                    |
| `/register`             | Register                    | Publik       | Daftar akun baru (nama, email, password)                    |
| `/dashboard`            | Dashboard Toko — Ringkasan  | Pemilik toko | Statistik ringkas, grafik, stok menipis, transaksi terakhir |
| `/dashboard/produk`     | Dashboard Toko — Produk     | Pemilik toko | CRUD produk + kategori                                      |
| `/dashboard/diskon`     | Dashboard Toko — Diskon     | Pemilik toko | CRUD diskon                                                 |
| `/dashboard/keuangan`   | Dashboard Toko — Keuangan   | Pemilik toko | Pencatatan pemasukan/pengeluaran                            |
| `/dashboard/pengaturan` | Dashboard Toko — Pengaturan | Pemilik toko | Profil toko, logo, tema, publish                            |
| `/builder`              | Web Builder                 | Pemilik toko | Drag & drop editor website                                  |
| `/pos`                  | Kasir (POS)                 | Pemilik toko | Layani transaksi offline                                    |
| `/admin`                | Admin Platform              | Admin        | Kelola semua toko & user                                    |
| `/:slug`                | Storefront                  | Publik       | Website toko yang dipublikasikan                            |

> Jika user belum punya toko saat membuka `/dashboard` atau `/pos`, tampilkan wizard **CreateStore** (buat toko: nama, slug, deskripsi).

**Layout dashboard:** Sidebar kiri (desktop) / bottom-nav atau drawer (mobile) dengan menu: Ringkasan, Produk, Diskon, Keuangan, Kasir (POS), Web Builder, Pengaturan. Header kanan berisi tombol "Lihat Website" + badge "Draft" jika belum dipublikasikan.

---

## 3. Detail Halaman & Fitur (Saat Ini)

### 3.1 Landing Page (`/`)

- Navbar sticky: logo "UMKM Builder", tombol Masuk / Daftar Gratis (atau Admin + Buka Dashboard jika sudah login).
- Hero: badge "Platform website untuk UMKM Indonesia", headline besar, subheadline, CTA.
- Grid 6 fitur: Web Builder Drag & Drop, Alamat Toko Otomatis, Dashboard Toko Sendiri, Pencatatan Keuangan, Kasir (POS) Offline, Kustomisasi Section.
- Bagian cara kerja, footer.

### 3.2 Login (`/login`) & Register (`/register`)

- Form card di tengah, branding platform.
- Login: email, password, link ke register.
- Register: nama lengkap, email, password; otomatis membuat profil user.

### 3.3 Dashboard Toko — Ringkasan (`/dashboard`)

- Stat card: Total Produk, Pemasukan bulan ini, Pengeluaran bulan ini, Penjualan hari ini.
- Grafik batang 7 hari terakhir (Pemasukan vs Pengeluaran) — Recharts.
- Daftar "Stok menipis" (stok ≤ 5) dan transaksi terakhir.

### 3.4 Produk (`/dashboard/produk`)

- Daftar produk (kartu/tabel): nama, harga, harga modal, stok, kategori, gambar, status aktif.
- Pencarian, filter kategori.
- CRUD produk via modal: nama, deskripsi, harga, harga modal, stok, kategori, upload gambar, aktif/nonaktif.
- CRUD kategori.
- Konversi Rupiah otomatis.

### 3.5 Diskon (`/dashboard/diskon`)

- Daftar diskon: nama, tipe (persen/nominal), nilai, produk target (atau semua produk), rentang tanggal, status.
- CRUD via modal dengan validasi (persen 1–100, tanggal akhir ≥ tanggal mulai).

### 3.6 Keuangan (`/dashboard/keuangan`)

- Ringkasan laba/rugi periode.
- Daftar catatan keuangan: tipe (pemasukan/pengeluaran), kategori, jumlah, catatan, tanggal.
- Tambah/edit/hapus catatan; pemasukan dari POS tercatat otomatis.

### 3.7 Pengaturan (`/dashboard/pengaturan`)

- Profil toko: nama, slug, deskripsi, logo (upload), WhatsApp.
- Tema: warna utama (primary), font.
- Toggle **Publish / Draft** website.

### 3.8 Web Builder (`/builder`)

- Editor drag & drop berbasis section (dnd-kit).
- Daftar section tersedia: **Hero, Tentang Kami, Produk, Galeri, Testimoni, Kontak**.
- Panel kiri: daftar section (bisa disusun ulang, tambah, hapus, sembunyikan/tampilkan).
- Panel tengah: preview real-time — render section sebenarnya, dengan toggle viewport **Desktop / Mobile**.
- Panel kanan: editor properti section aktif (teks, gambar, warna latar, warna teks, posisi, dll).
- Pengaturan warna utama (primary theme) global.
- Simpan (persist ke tabel `store_sections`), indikator "dirty/unsaved", preview toko, tombol publish.
- Data produk pada section "Produk" diambil otomatis dari Dashboard Toko; diskon aktif otomatis mempengaruhi harga tampil.

### 3.9 Kasir / POS (`/pos`)

- Katalog produk: grid, filter kategori, pencarian.
- Keranjang: tambah/kurang qty, hapus item, diskon per item otomatis dari diskon aktif.
- Metode bayar: Tunai / QRIS / Transfer; input nominal bayar, hitung kembalian.
- Checkout: simpan transaksi atomik (invoice `INV-YYMMDD-HHMISS-xxxx`), kurangi stok, catat pemasukan otomatis.
- Modal struk / nota dengan tombol cetak.

### 3.10 Admin Platform (`/admin`)

- Daftar semua toko: nama, pemilik (nama/email), slug, tanggal dibuat, status.
- Pencarian toko.
- Aksi: aktifkan/nonaktifkan toko, hapus toko permanen.
- Statistik jumlah toko & user.

### 3.11 Storefront (`/:slug`) — Website publik toko

- Header sticky: logo + nama toko, link WhatsApp (CTA belanja/kontak).
- Render section sesuai urutan konfigurasi builder; hanya section visible & toko published/active.
- Tema mengikuti pengaturan toko (warna primary, font).
- Halaman 404 ramah jika slug tidak ada / belum publish.

### 3.12 Struktur Data (Supabase)

- `profiles` (id, full_name, email, role: admin|umkm)
- `stores` (owner, name, slug unik, description, logo_url, whatsapp, theme jsonb, is_published, is_active)
- `store_sections` (store_id, type, position, content jsonb, is_visible)
- `categories`, `products` (harga, harga modal, stok, gambar, is_active), `discounts`
- `transactions` + `transaction_items` (invoice, subtotal, diskon, total, bayar, kembalian, metode, source: pos|online)
- `finances` (income|expense, kategori, amount, tanggal, link transaksi)
- Storage bucket publik `store-assets`
- Semua tabel dilindungi Row Level Security (pemilik kelola miliknya; publik hanya baca toko yang published).

---

## 4. Fitur Belum Ada — Untuk Didesain & Ditambahkan

### 4.1 Sistem Berlangganan (Subscription) 🆕

Deskripsikan sebagai model freemium SaaS:

| Paket                | Target                    | Batasan (indikatif)                                                        |
| -------------------- | ------------------------- | -------------------------------------------------------------------------- |
| **Gratis**           | UMKM baru                 | 1 website, ≤ 10 produk, watermark brand platform, section terbatas         |
| **Bisnis**           | UMKM bertumbuh            | Produk unlimited, semua section, custom domain, tanpa watermark            |
| **Pro / Enterprise** | UMKM besar / multi-cabang | Semua fitur Bisnis + multi-user/staff, laporan lanjutan, prioritas support |

**UI/UX yang perlu didesain:**

- **Halaman Harga/Pricing** (dapat diakses dari Landing Page): kartu perbandingan 3 paket, badge "Paling Populer", CTA per paket, tabel perbandingan fitur lengkap, FAQ.
- **Halaman Pilih Paket saat onboarding** (opsional, bisa di-skip untuk trial gratis).
- **Halaman Manajemen Langganan** di Dashboard (`/dashboard/langganan`): paket aktif, tanggal perpanjangan, riwayat pembayaran/status invoice, upgrade/downgrade, pembatalan.
- **Modal Checkout langganan**: pilih periode (bulanan/tahunan dengan badge hemat), metode pembayaran lokal (QRIS, Transfer Bank, e-wallet), ringkasan tagihan.
- **Status paket di UI**: badge di sidebar/header; banner up-sell yang tidak mengganggu; halaman fitur "terkunci" dengan upgrade CTA (bukan blok keras).
- **Batasan terlihat**: usage meter (mis. "7/10 produk digunakan") dengan progress bar; modal pemberitahuan saat limit tercapai.
- **Trial**: banner countdown trial 14 hari, CTA upgrade sebelum habis.
- **State dunning**: kartu gagal bayar → banner peringatan + petunjuk perbaiki pembayaran.
- Untuk Admin Platform: halaman kelola langganan (paket user, status, manual override, MRR/revenue overview).

### 4.2 Template Builder per Industri 🆕

Deskripsikan sebagai galeri template siap-pakai yang mengisi section, konten, warna, dan produk contoh sesuai jenis usaha:

**Kategori template (contoh):**

- 🍜 **Makanan & Minuman** (warung, kafe, katering): hero foto menu, section Menu/Favorit, testimoni, Google Maps, WhatsApp order.
- 👗 **Fashion** (butik, hijab, distro): hero lookbook, galeri produk besar, grid produk 4 kolom, instagram feed, sizing info.
- 🛠️ **Jasa** (laundry, bengkel, salon): hero layanan, daftar paket harga, testimoni, booking via WhatsApp, jam operasional.
- 🌱 **Pertanian / Hasil Tani**: hero panen, katalog produk segar, cerita petani, keunggulan produk.
- 🎨 **Kerajinan / Kriya**: hero cerita artisan, galeri proses produksi, katalog, cerita nilai budaya.
- 📚 **Kursus / Edukasi**: hero kelas, daftar program, jadwal, harga paket, pendaftaran.
- 🏠 **Properti / Konstruksi**: hero proyek, portofolio galeri, layanan, testimoni klien.

**UI/UX yang perlu didesain:**

- **Galeri Template** (`/builder/templates` atau langkah pertama wizard builder): grid preview thumbnail template (screenshot viewport desktop + mobile), filter/search kategori industri, badge "Baru"/"Populer".
- **Preview modal full-page** template sebelum dipilih, dengan CTA "Gunakan Template Ini".
- **Wizard onboarding builder**: Pilih industri → Pilih template → (opsional) isi info dasar toko (nama, tagline, WA, alamat) → masuk editor dengan section & konten placeholder siap edit.
- **Perilaku apply template**: mengganti/merge section default + konten demo + palet warna industri (mis. makanan = warna hangat oranye/merah; fashion = hitam/putih elegan; pertanian = hijau alami); jangan menimpa data toko pengguna tanpa konfirmasi (modal konfirmasi "Template akan mengganti susunan section Anda").
- **Template Store di Landing Page**: section showcase template untuk memancing pendaftaran, dengan filter industri.
- Untuk paket berbayar: tandai template premium dengan badge 🔒 + preview blur.
- Admin: kemampuan menambah/mengelola template (metadata, thumbnail, kategori, paket minimum).

---

## 5. Prinsip Desain & Komponen

- **Prinsip:** mobile-first (pemilik UMKM sering pakai HP), bahasa sederhana tanpa jargon, aksi utama selalu jelas, feedback instan (toast), kosong tapi informatif (empty state dengan ilustrasi + CTA).
- **Komponen yang sudah ada:** Sidebar/Drawer, Modal, Field (input/label), Spinner (loading full & inline), EmptyState, StatCard, ImageUpload (upload ke storage), badge status, tombol `btn-primary`/`btn-secondary`/`btn-ghost`, toast.
- **Gaya visual saat ini:** Tailwind, rounded-lg, shadow halus, border slate tipis, latar putih/abu sangat muda, heading `font-extrabold`, aksen brand indigo.
- **Format & lokal:** Rupiah (`Rp1.000.000`), tanggal Indonesia, waktu Asia/Jakarta, harga diskon dihitung otomatis.

---

## 6. Ringkasan Kebutuhan Desain Baru (Checklist untuk AI)

1. Pricing page (3 paket + tabel perbandingan + FAQ) — gaya konsisten dengan Landing Page.
2. Halaman Manajemen Langganan di dashboard + modal checkout (QRIS/transfer/e-wallet).
3. Usage meter, badge paket, banner trial & up-sell, modal limit tercapai.
4. Halaman Admin untuk kelola langganan & pendapatan.
5. Galeri Template Builder per industri (grid thumbnail, filter kategori, badge premium).
6. Preview modal template full-page + wizard onboarding 3 langkah (industri → template → info dasar).
7. Palet warna & konten contoh per industri untuk setiap template.
8. Semua halaman responsif (desktop, tablet, mobile) dan konsisten dengan komponen yang sudah ada.
