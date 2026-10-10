-- Catálogo de classificação. Categoria de sistema não tem dono.
-- Categoria do usuário pertence a um usuário e não pode virar categoria de sistema.

create function private.set_categories_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.set_categories_updated_at() from public;
revoke all on function private.set_categories_updated_at() from anon, authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users (id) on delete restrict,
  name text not null,
  slug text not null,
  kind text not null,
  parent_id uuid null,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_parent_fkey
    foreign key (parent_id)
    references public.categories (id)
    on delete restrict,
  constraint categories_kind_check
    check (kind in ('EXPENSE', 'INCOME', 'TRANSFER')),
  constraint categories_name_not_blank
    check (char_length(btrim(name)) > 0),
  constraint categories_slug_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint categories_owner_check
    check (
      (is_system = true and user_id is null)
      or (is_system = false and user_id is not null)
    ),
  constraint categories_parent_not_self
    check (parent_id is null or parent_id <> id)
);

create index categories_user_id_idx on public.categories (user_id);
create index categories_parent_id_idx on public.categories (parent_id);

create unique index categories_system_kind_slug_key
  on public.categories (kind, slug)
  where is_system = true;

create unique index categories_user_active_kind_slug_key
  on public.categories (user_id, kind, slug)
  where is_system = false and is_active = true;

create trigger categories_set_updated_at
before update on public.categories
for each row
execute function private.set_categories_updated_at();

alter table public.categories enable row level security;

revoke all on table public.categories from public;
revoke all on table public.categories from anon;

grant select, insert, update on table public.categories to authenticated;

revoke truncate, references, trigger on table public.categories from authenticated;

create policy categories_select_visible
on public.categories
for select
to authenticated
using (
  is_system = true
  or (select auth.uid()) = user_id
);

create policy categories_insert_own
on public.categories
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and is_system = false
);

create policy categories_update_own
on public.categories
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and is_system = false
)
with check (
  (select auth.uid()) = user_id
  and is_system = false
);

insert into public.categories (user_id, name, slug, kind, is_system)
values
  (null, 'Moradia', 'moradia', 'EXPENSE', true),
  (null, 'Alimentação', 'alimentacao', 'EXPENSE', true),
  (null, 'Combustível', 'combustivel', 'EXPENSE', true),
  (null, 'Transporte', 'transporte', 'EXPENSE', true),
  (null, 'Saúde', 'saude', 'EXPENSE', true),
  (null, 'Educação', 'educacao', 'EXPENSE', true),
  (null, 'Lazer', 'lazer', 'EXPENSE', true),
  (null, 'Assinaturas', 'assinaturas', 'EXPENSE', true),
  (null, 'Impostos', 'impostos', 'EXPENSE', true),
  (null, 'Seguros', 'seguros', 'EXPENSE', true),
  (null, 'Veículos', 'veiculos', 'EXPENSE', true),
  (null, 'Viagens', 'viagens', 'EXPENSE', true),
  (null, 'Compras', 'compras', 'EXPENSE', true),
  (null, 'Serviços', 'servicos', 'EXPENSE', true),
  (null, 'Outros', 'outros', 'EXPENSE', true),
  (null, 'Salário', 'salario', 'INCOME', true),
  (null, 'Pró-labore', 'pro-labore', 'INCOME', true),
  (null, 'Distribuição de lucros', 'distribuicao-de-lucros', 'INCOME', true),
  (null, 'Reembolso recebido', 'reembolso-recebido', 'INCOME', true),
  (null, 'Venda', 'venda', 'INCOME', true),
  (null, 'Rendimentos', 'rendimentos', 'INCOME', true),
  (null, 'Outros', 'outros', 'INCOME', true),
  (null, 'Transferência entre contas', 'transferencia-entre-contas', 'TRANSFER', true)
on conflict (kind, slug) where is_system = true do nothing;
