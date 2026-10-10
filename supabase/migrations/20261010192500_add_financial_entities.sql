-- Entidades financeiras do usuário. Sem exclusão física nesta sprint.
-- user_id usa ON DELETE RESTRICT: apagar o usuário autenticado fica bloqueado
-- enquanto existir entidade, até a decisão de exclusão de conta.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create function private.set_entities_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.set_entities_updated_at() from public;
revoke all on function private.set_entities_updated_at() from anon, authenticated;

create table public.entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  type text not null,
  name text not null,
  document_number text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entities_type_check check (type in ('PERSON', 'COMPANY')),
  constraint entities_name_not_blank check (char_length(btrim(name)) > 0),
  constraint entities_document_digits check (
    document_number is null or document_number ~ '^[0-9]+$'
  )
);

create index entities_user_id_idx on public.entities (user_id);

create trigger entities_set_updated_at
before update on public.entities
for each row
execute function private.set_entities_updated_at();

alter table public.entities enable row level security;

revoke all on table public.entities from public;
revoke all on table public.entities from anon;

grant select, insert, update on table public.entities to authenticated;

create policy entities_select_own
on public.entities
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy entities_insert_own
on public.entities
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy entities_update_own
on public.entities
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
