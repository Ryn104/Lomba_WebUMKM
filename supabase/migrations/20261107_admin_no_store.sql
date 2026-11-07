create or replace function public.prevent_admin_store()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.profiles where id = new.owner_id and role = 'admin') then
    raise exception 'Akun admin platform tidak dapat memiliki toko';
  end if;
  return new;
end; $$;

drop trigger if exists stores_no_admin_owner on public.stores;
create trigger stores_no_admin_owner
  before insert or update of owner_id on public.stores
  for each row execute function public.prevent_admin_store();

create or replace function public.prevent_admin_with_store()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'admin' and old.role is distinct from 'admin'
     and exists (select 1 from public.stores where owner_id = new.id) then
    raise exception 'Pengguna ini masih memiliki toko. Hapus tokonya terlebih dahulu sebelum dijadikan admin';
  end if;
  return new;
end; $$;

drop trigger if exists profiles_no_admin_with_store on public.profiles;
create trigger profiles_no_admin_with_store
  before update of role on public.profiles
  for each row execute function public.prevent_admin_with_store();