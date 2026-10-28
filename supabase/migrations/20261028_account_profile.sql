-- Profile fields and owner-scoped profile avatar storage.
-- Existing store-assets bucket remains public for storefront imagery.

alter table public.profiles
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists avatar_path text;

-- Preserve the role guard and ensure Auth, not profiles.email, controls account email.
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() and auth.uid() is not null then
    new.role := old.role;
  end if;
  if new.email is distinct from old.email then
    new.email := old.email;
  end if;
  return new;
end; $$;

-- The application stores avatars as avatars/<auth.uid()>/<filename>.
-- Keep the existing bucket and public read policy; scope avatar uploads by folder.
drop policy if exists "assets: user login upload" on storage.objects;
drop policy if exists "assets: user upload own avatar or store asset" on storage.objects;
create policy "assets: user upload own avatar or store asset" on storage.objects
  for insert
  with check (
    bucket_id = 'store-assets'
    and auth.role() = 'authenticated'
    and (
      (storage.foldername(name))[1] <> 'avatars'
      or (storage.foldername(name))[2] = auth.uid()::text
    )
  );
