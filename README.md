# UMKM Web Builder

Platform pembuat website toko UMKM. Setiap toko mendapat website di `umkm.rtrwstudio.online/nama-toko`, lengkap dengan dashboard sendiri, keuangan, dan kasir (POS).

**Stack:** React + Vite (JavaScript), Supabase (Auth, PostgreSQL, Storage), Tailwind CSS, @dnd-kit, Recharts, Lucide, React Hot Toast.

## Cara menjalankan

1. **Install dependensi**
   ```bash
   npm install
   ```
2. **Buat project Supabase**, lalu buka *SQL Editor* dan jalankan seluruh isi `supabase/schema.sql`
   (tabel, trigger, RLS, fungsi kasir, dan bucket storage `store-assets`).
3. **Isi environment**
   ```bash
   cp .env.example .env
   # isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY (Supabase > Project Settings > API)
   ```
4. **Jalankan**
   ```bash
   npm run dev
   ```
5. **Jadikan akun Anda admin platform.** Daftar dulu lewat `/register`, lalu di SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'email-anda@gmail.com';
   ```
   Setelah itu `/admin` bisa diakses.

> Untuk pengembangan, matikan *Confirm email* di Supabase > Authentication > Providers > Email agar bisa langsung login setelah daftar.

## Rute

| Rute | Fungsi |
|---|---|
| `/` | Landing page platform |
| `/login`, `/register` | Auth (Supabase) |
| `/admin` | Dashboard admin platform (khusus role `admin`) |
| `/builder` | Web builder drag & drop + publish |
| `/dashboard` | Dashboard toko: ringkasan, produk, diskon, keuangan, pengaturan |
| `/pos` | Kasir untuk penjualan offline |
| `/:slug` | Website publik toko, contoh `/toko-umkm-a` |

## Alur kerja

1. UMKM daftar → buat toko (nama + alamat `slug`).
2. Di **Web Builder**: tambah/urutkan section (Hero, Tentang, Produk, Galeri, Testimoni, Kontak) dengan drag & drop, ubah teks/warna/gambar, lihat preview real-time, klik **Publish**.
3. Di **Dashboard Toko**: tambah produk & kategori, buat diskon. Produk aktif otomatis tampil di section Produk pada `/:slug`.
4. **Keuangan**: catat pengeluaran/pemasukan; grafik bulanan & per kategori; ekspor CSV.
5. **Kasir**: pilih produk, diskon dihitung otomatis, bayar tunai/QRIS/transfer. Satu panggilan RPC `create_pos_transaction` menyimpan transaksi, mengurangi stok, dan mencatat pemasukan di keuangan secara atomik.

## Deploy ke `umkm.rtrwstudio.online`

- Build: `npm run build` (output `dist/`).
- Hosting SPA apa pun (Vercel, Netlify, Cloudflare Pages, Nginx). Semua path harus di-rewrite ke `index.html`; file `vercel.json` dan `public/_redirects` sudah disertakan.
- Arahkan DNS subdomain `umkm` ke hosting, dan set `VITE_PLATFORM_DOMAIN=umkm.rtrwstudio.online`.
- Di Supabase > Authentication > URL Configuration, tambahkan `https://umkm.rtrwstudio.online` sebagai Site URL.

## Catatan keamanan

- Semua tabel memakai Row Level Security: toko hanya bisa dibaca publik jika `is_published` dan `is_active`; data keuangan & transaksi hanya untuk pemilik toko (dan admin untuk baca).
- Slug yang bentrok dengan rute sistem (`login`, `admin`, `dashboard`, dll.) ditolak.
- Kunci `anon` aman dipakai di frontend; jangan pernah memakai `service_role` di kode frontend.
