-- =====================================================================
-- UMKM Web Builder — Skema Supabase
-- Jalankan seluruh file ini di Supabase > SQL Editor
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  avatar_path text,
  role text not null default 'umkm' check (role in ('admin','umkm')),
  created_at timestamptz not null default now()
);

-- Buat profil otomatis saat user mendaftar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: apakah user saat ini admin platform?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- STORES ----------
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  logo_url text,
  whatsapp text,
  theme jsonb not null default '{"primary":"#4f46e5","font":"Inter"}'::jsonb,
  is_published boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists stores_owner_idx on public.stores(owner_id);

-- Helper: apakah user saat ini pemilik toko?
create or replace function public.owns_store(sid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.stores where id = sid and owner_id = auth.uid());
$$;

-- ---------- STORE SECTIONS (konfigurasi web builder) ----------
create table if not exists public.store_sections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  type text not null check (type in ('hero','about','products','gallery','testimonials','contact')),
  position int not null default 0,
  content jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists store_sections_store_idx on public.store_sections(store_id, position);

-- ---------- CATEGORIES ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(14,2) not null default 0 check (price >= 0),
  cost_price numeric(14,2) not null default 0 check (cost_price >= 0),
  stock int not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists products_store_idx on public.products(store_id);

-- ---------- DISCOUNTS ----------
create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade, -- null = semua produk
  name text not null,
  type text not null check (type in ('percent','nominal')),
  value numeric(14,2) not null check (value > 0),
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists discounts_store_idx on public.discounts(store_id);

-- ---------- TRANSACTIONS (POS) ----------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  invoice_no text not null,
  subtotal numeric(14,2) not null default 0,
  discount_total numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  paid numeric(14,2) not null default 0,
  change_amount numeric(14,2) not null default 0,
  payment_method text not null default 'cash' check (payment_method in ('cash','qris','transfer')),
  source text not null default 'pos' check (source in ('pos','online')),
  created_at timestamptz not null default now()
);
create index if not exists transactions_store_idx on public.transactions(store_id, created_at desc);

create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  price numeric(14,2) not null,
  qty int not null check (qty > 0),
  discount numeric(14,2) not null default 0,
  subtotal numeric(14,2) not null
);

-- ---------- FINANCES ----------
create table if not exists public.finances (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  category text not null default 'Lainnya',
  amount numeric(14,2) not null check (amount > 0),
  note text,
  date date not null default current_date,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists finances_store_idx on public.finances(store_id, date desc);

-- =====================================================================
-- FUNGSI POS: simpan transaksi + item + kurangi stok + catat pemasukan
-- (atomik dalam satu panggilan RPC)
-- =====================================================================
create or replace function public.create_pos_transaction(
  p_store_id uuid,
  p_items jsonb,            -- [{product_id, product_name, price, qty, discount}]
  p_discount_total numeric,
  p_paid numeric,
  p_method text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_tx uuid;
  v_subtotal numeric := 0;
  v_total numeric;
  v_inv text;
  it jsonb;
begin
  if not public.owns_store(p_store_id) then
    raise exception 'Tidak berwenang';
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    v_subtotal := v_subtotal + ((it->>'price')::numeric * (it->>'qty')::int);
  end loop;

  v_total := greatest(v_subtotal - coalesce(p_discount_total,0), 0);
  v_inv := 'INV-' || to_char(now() at time zone 'Asia/Jakarta','YYMMDD-HH24MISS') || '-' || substr(gen_random_uuid()::text,1,4);

  insert into public.transactions
    (store_id, invoice_no, subtotal, discount_total, total, paid, change_amount, payment_method, source)
  values
    (p_store_id, v_inv, v_subtotal, coalesce(p_discount_total,0), v_total, p_paid, greatest(p_paid - v_total,0), p_method, 'pos')
  returning id into v_tx;

  for it in select * from jsonb_array_elements(p_items) loop
    insert into public.transaction_items
      (transaction_id, product_id, product_name, price, qty, discount, subtotal)
    values (
      v_tx,
      nullif(it->>'product_id','')::uuid,
      it->>'product_name',
      (it->>'price')::numeric,
      (it->>'qty')::int,
      coalesce((it->>'discount')::numeric,0),
      ((it->>'price')::numeric * (it->>'qty')::int) - coalesce((it->>'discount')::numeric,0)
    );

    if nullif(it->>'product_id','') is not null then
      update public.products
         set stock = greatest(stock - (it->>'qty')::int, 0)
       where id = (it->>'product_id')::uuid and store_id = p_store_id;
    end if;
  end loop;

  insert into public.finances (store_id, type, category, amount, note, transaction_id)
  values (p_store_id, 'income', 'Penjualan Kasir', v_total, 'Transaksi ' || v_inv, v_tx);

  return v_tx;
end; $$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.stores            enable row level security;
alter table public.store_sections    enable row level security;
alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.discounts         enable row level security;
alter table public.transactions      enable row level security;
alter table public.transaction_items enable row level security;
alter table public.finances          enable row level security;

-- profiles
create policy "profil: baca sendiri/admin" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "profil: ubah sendiri" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profil: admin ubah semua" on public.profiles for update using (public.is_admin());

-- Cegah user biasa mengubah role dirinya sendiri
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() and auth.uid() is not null then
    new.role := old.role;
  end if;
  -- Auth remains the source of truth for email; changing profiles.email alone is not allowed.
  if new.email is distinct from old.email then
    new.email := old.email;
  end if;
  return new;
end; $$;
drop trigger if exists protect_role on public.profiles;
create trigger protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- stores
create policy "toko: publik baca yg dipublish" on public.stores for select
  using (is_published = true and is_active = true);
create policy "toko: pemilik baca" on public.stores for select using (owner_id = auth.uid());
create policy "toko: admin baca" on public.stores for select using (public.is_admin());
create policy "toko: pemilik buat" on public.stores for insert with check (owner_id = auth.uid());
create policy "toko: pemilik ubah" on public.stores for update using (owner_id = auth.uid());
create policy "toko: admin ubah" on public.stores for update using (public.is_admin());
create policy "toko: pemilik hapus" on public.stores for delete using (owner_id = auth.uid() or public.is_admin());

-- store_sections
create policy "section: publik baca" on public.store_sections for select
  using (exists (select 1 from public.stores s where s.id = store_id and s.is_published and s.is_active));
create policy "section: pemilik kelola" on public.store_sections for all
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));

-- categories
create policy "kategori: publik baca" on public.categories for select
  using (exists (select 1 from public.stores s where s.id = store_id and s.is_published and s.is_active));
create policy "kategori: pemilik kelola" on public.categories for all
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));

-- products
create policy "produk: publik baca" on public.products for select
  using (is_active and exists (select 1 from public.stores s where s.id = store_id and s.is_published and s.is_active));
create policy "produk: pemilik kelola" on public.products for all
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));

-- discounts
create policy "diskon: publik baca" on public.discounts for select
  using (is_active and exists (select 1 from public.stores s where s.id = store_id and s.is_published and s.is_active));
create policy "diskon: pemilik kelola" on public.discounts for all
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));

-- transactions (privat: hanya pemilik / admin)
create policy "transaksi: pemilik kelola" on public.transactions for all
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));
create policy "transaksi: admin baca" on public.transactions for select using (public.is_admin());

create policy "item: pemilik kelola" on public.transaction_items for all
  using (exists (select 1 from public.transactions t where t.id = transaction_id and public.owns_store(t.store_id)))
  with check (exists (select 1 from public.transactions t where t.id = transaction_id and public.owns_store(t.store_id)));

-- finances
create policy "keuangan: pemilik kelola" on public.finances for all
  using (public.owns_store(store_id)) with check (public.owns_store(store_id));
create policy "keuangan: admin baca" on public.finances for select using (public.is_admin());

-- =====================================================================
-- STORAGE (gambar produk, logo, section)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

create policy "assets: publik baca" on storage.objects for select
  using (bucket_id = 'store-assets');
create policy "assets: user upload own avatar or store asset" on storage.objects for insert
  with check (
    bucket_id = 'store-assets'
    and auth.role() = 'authenticated'
    and (
      (storage.foldername(name))[1] <> 'avatars'
      or (storage.foldername(name))[2] = auth.uid()::text
    )
  );
create policy "assets: pemilik ubah/hapus" on storage.objects for update
  using (bucket_id = 'store-assets' and owner = auth.uid());
create policy "assets: pemilik hapus" on storage.objects for delete
  using (bucket_id = 'store-assets' and owner = auth.uid());

-- =====================================================================
-- JADIKAN AKUN ANDA ADMIN PLATFORM (jalankan setelah register):
--   update public.profiles set role = 'admin' where email = 'email-anda@gmail.com';
-- =====================================================================
