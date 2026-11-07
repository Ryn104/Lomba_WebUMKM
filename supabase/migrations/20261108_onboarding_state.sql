-- Wizard onboarding 3 langkah menyimpan status di stores.theme.onboarding_done.
-- Toko yang sudah ada sebelum fitur ini tidak boleh dipaksa mengulang langkah 2,
-- jadi tandai selesai sekali di sini. Toko yang dibuat setelah migrasi ini
-- (lewat langkah 1 onboarding) tetap tanpa penanda sampai pengguna memilih paket
-- atau menekan "Lewati, pakai Gratis".

update public.stores
set theme = jsonb_set(coalesce(theme, '{}'::jsonb), '{onboarding_done}', 'true'::jsonb, true)
where coalesce(theme, '{}'::jsonb)->'onboarding_done' is null
  and created_at < now();
