-- Emerald Guild: production-ready starter schema for Supabase/Postgres
-- Run this entire file in Supabase SQL Editor.

create schema if not exists private;
extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null,
  role text not null default 'member' check (role in ('member','admin')),
  rank text not null default 'مستجد',
  status text not null default 'active' check (status in ('active','pending','suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  balance numeric(18,2) not null default 0 check (balance >= 0),
  currency text not null default 'EMD',
  status text not null default 'active' check (status in ('active','blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(18,2) not null,
  type text not null check (type in ('deposit','withdrawal','transfer_in','transfer_out','adjustment')),
  description text,
  status text not null default 'completed' check (status in ('pending','completed','cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null default 'gear',
  price numeric(18,2) not null default 0 check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  customer_user_id uuid references public.profiles(id) on delete set null,
  quantity integer not null check (quantity > 0),
  customer_name text not null,
  customer_phone text not null,
  status text not null default 'pending' check (status in ('pending','confirmed','processing','shipped','completed','cancelled')),
  total numeric(18,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bank_transactions_user_id_idx on public.bank_transactions(user_id);
create index if not exists products_active_idx on public.products(is_active);
create index if not exists orders_status_idx on public.orders(status);

-- Auto-create profile + zero-balance bank account at signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'username',''),
    coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1))
  )
  on conflict (id) do nothing;

  insert into public.bank_accounts (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- updated_at helpers
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists bank_accounts_touch on public.bank_accounts;
create trigger bank_accounts_touch before update on public.bank_accounts for each row execute procedure public.touch_updated_at();
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute procedure public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute procedure public.touch_updated_at();

-- Role helper for RLS. This function is intentionally kept in private schema and not exposed through Data API.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin' and p.status = 'active'
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.bank_transactions enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Grants: least privilege through Data API.
revoke all on table public.profiles, public.bank_accounts, public.bank_transactions, public.products, public.orders from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.bank_accounts to authenticated;
grant select on public.bank_transactions to authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert, select, update on public.orders to anon, authenticated;
grant select, insert on public.bank_transactions to authenticated;
grant select, update on public.bank_accounts to authenticated;

-- Profiles
create policy profiles_self_select on public.profiles for select to authenticated
using ((select auth.uid()) = id or private.is_admin());
create policy profiles_self_update on public.profiles for update to authenticated
using ((select auth.uid()) = id or private.is_admin())
with check ((select auth.uid()) = id or private.is_admin());
create policy profiles_insert_self on public.profiles for insert to authenticated
with check ((select auth.uid()) = id or private.is_admin());

-- Bank accounts: member sees own, admin sees all and can adjust.
create policy bank_self_select on public.bank_accounts for select to authenticated
using ((select auth.uid()) = user_id or private.is_admin());
create policy bank_admin_update on public.bank_accounts for update to authenticated
using (private.is_admin()) with check (balance >= 0);

-- Transactions: member reads own; admin reads/inserts all.
create policy tx_self_select on public.bank_transactions for select to authenticated
using ((select auth.uid()) = user_id or private.is_admin());
create policy tx_admin_insert on public.bank_transactions for insert to authenticated
with check (private.is_admin());

-- Public store catalog.
create policy products_public_select on public.products for select to anon, authenticated
using (is_active = true or private.is_admin());
create policy products_admin_insert on public.products for insert to authenticated
with check (private.is_admin());
create policy products_admin_update on public.products for update to authenticated
using (private.is_admin()) with check (private.is_admin());
create policy products_admin_delete on public.products for delete to authenticated
using (private.is_admin());

-- Orders: guests can create pending orders; logged-in user may create for self; admins manage all.
create policy orders_public_insert on public.orders for insert to anon, authenticated
with check (status = 'pending');
create policy orders_self_select on public.orders for select to authenticated
using ((select auth.uid()) = customer_user_id or private.is_admin());
create policy orders_self_update on public.orders for update to authenticated
using ((select auth.uid()) = customer_user_id or private.is_admin())
with check ((select auth.uid()) = customer_user_id or private.is_admin());

-- Seed a few visible products. Safe to run repeatedly.
insert into public.products (name, description, category, price, stock)
select * from (values
 ('رتبة فارس الزمرد', 'ترقية رتبة داخل النقابة.', 'rank', 1000::numeric, 20),
 ('درع الزمرد الأسطوري', 'عتاد نادر للاستخدام داخل عالم النقابة.', 'gear', 2500::numeric, 8),
 ('سبيكة زمرد', 'حزمة عملات EMD.', 'currency', 500::numeric, 50)
) v(name,description,category,price,stock)
where not exists (select 1 from public.products p where p.name = v.name);

-- بعد إنشاء حسابك، اجعل حسابك مسؤولاً من SQL Editor بتحديد البريد هنا:
-- update public.profiles p set role='admin' where p.id = (select id from auth.users where email='PUT-ADMIN-EMAIL-HERE');
