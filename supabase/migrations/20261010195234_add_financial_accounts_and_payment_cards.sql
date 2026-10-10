-- Contas e cartões pertencem a uma entidade do mesmo usuário.
-- Sem exclusão física nesta entrega. Sem número completo, código de segurança, validade ou token.

create function private.set_financial_accounts_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create function private.set_payment_cards_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.set_financial_accounts_updated_at() from public;
revoke all on function private.set_financial_accounts_updated_at() from anon, authenticated;
revoke all on function private.set_payment_cards_updated_at() from public;
revoke all on function private.set_payment_cards_updated_at() from anon, authenticated;

create table public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  entity_id uuid not null,
  name text not null,
  institution_name text null,
  account_type text not null,
  last_four text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_accounts_entity_user_fkey
    foreign key (entity_id, user_id)
    references public.entities (id, user_id)
    on delete restrict,
  constraint financial_accounts_type_check
    check (account_type in ('CHECKING', 'SAVINGS', 'DIGITAL', 'CASH', 'OTHER')),
  constraint financial_accounts_name_not_blank
    check (char_length(btrim(name)) > 0),
  constraint financial_accounts_institution_not_blank
    check (institution_name is null or char_length(btrim(institution_name)) > 0),
  constraint financial_accounts_last_four_check
    check (last_four is null or last_four ~ '^[0-9]{4}$')
);

create table public.payment_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  entity_id uuid not null,
  name text not null,
  issuer_name text null,
  brand text null,
  last_four text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_cards_entity_user_fkey
    foreign key (entity_id, user_id)
    references public.entities (id, user_id)
    on delete restrict,
  constraint payment_cards_name_not_blank
    check (char_length(btrim(name)) > 0),
  constraint payment_cards_issuer_not_blank
    check (issuer_name is null or char_length(btrim(issuer_name)) > 0),
  constraint payment_cards_brand_not_blank
    check (brand is null or char_length(btrim(brand)) > 0),
  constraint payment_cards_last_four_check
    check (last_four ~ '^[0-9]{4}$')
);

create index financial_accounts_user_id_idx on public.financial_accounts (user_id);
create index financial_accounts_entity_id_idx on public.financial_accounts (entity_id);
create index payment_cards_user_id_idx on public.payment_cards (user_id);
create index payment_cards_entity_id_idx on public.payment_cards (entity_id);

create trigger financial_accounts_set_updated_at
before update on public.financial_accounts
for each row
execute function private.set_financial_accounts_updated_at();

create trigger payment_cards_set_updated_at
before update on public.payment_cards
for each row
execute function private.set_payment_cards_updated_at();

alter table public.financial_accounts enable row level security;
alter table public.payment_cards enable row level security;

revoke all on table public.financial_accounts from public;
revoke all on table public.financial_accounts from anon;
revoke all on table public.payment_cards from public;
revoke all on table public.payment_cards from anon;

grant select, insert, update on table public.financial_accounts to authenticated;
grant select, insert, update on table public.payment_cards to authenticated;

revoke truncate, references, trigger on table public.financial_accounts from authenticated;
revoke truncate, references, trigger on table public.payment_cards from authenticated;

create policy financial_accounts_select_own
on public.financial_accounts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy financial_accounts_insert_own
on public.financial_accounts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy financial_accounts_update_own
on public.financial_accounts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy payment_cards_select_own
on public.payment_cards
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy payment_cards_insert_own
on public.payment_cards
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy payment_cards_update_own
on public.payment_cards
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
