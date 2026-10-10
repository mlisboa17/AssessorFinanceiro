-- Trilha imutável das mutações de cadastro. Fica no schema private, fora da Data API.
-- A função de trigger é security definer só para inserir nesta tabela, porque os
-- papéis da aplicação não recebem insert. actor_user_id vem da sessão; owner_user_id
-- vem da linha. INSERT e DELETE deixam changed_fields nulo. UPDATE lista só colunas
-- de negócio, sem updated_at.

create table private.audit_log (
  id bigint generated always as identity primary key,
  owner_user_id uuid null,
  actor_user_id uuid null,
  table_name text not null,
  record_id uuid not null,
  operation text not null,
  old_data jsonb null,
  new_data jsonb null,
  changed_fields text[] null,
  created_at timestamptz not null default now(),
  constraint audit_log_operation_check check (operation in ('INSERT', 'UPDATE', 'DELETE'))
);

create index audit_log_owner_created_idx
  on private.audit_log (owner_user_id, created_at desc);

create index audit_log_record_created_idx
  on private.audit_log (table_name, record_id, created_at desc);

revoke all on table private.audit_log from public;
revoke all on table private.audit_log from anon, authenticated;

alter table private.audit_log enable row level security;

create function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous_row jsonb;
  current_row jsonb;
  owner_id uuid;
  changed text[];
  target_id uuid;
begin
  if tg_op = 'INSERT' then
    current_row := pg_catalog.to_jsonb(new);
    previous_row := null;
    owner_id := (current_row ->> 'user_id')::uuid;
    target_id := (current_row ->> 'id')::uuid;
    changed := null;
  elsif tg_op = 'UPDATE' then
    previous_row := pg_catalog.to_jsonb(old);
    current_row := pg_catalog.to_jsonb(new);
    if current_row ->> 'user_id' is not null then
      owner_id := (current_row ->> 'user_id')::uuid;
    else
      owner_id := (previous_row ->> 'user_id')::uuid;
    end if;
    target_id := (current_row ->> 'id')::uuid;
    select pg_catalog.array_agg(diff.column_name order by diff.column_name)
      into changed
    from (
      select pg_catalog.coalesce(next_value.key, previous_value.key) as column_name
      from pg_catalog.jsonb_each(current_row) as next_value
      full outer join pg_catalog.jsonb_each(previous_row) as previous_value
        on next_value.key = previous_value.key
      where pg_catalog.coalesce(next_value.key, previous_value.key) <> 'updated_at'
        and next_value.value is distinct from previous_value.value
    ) as diff;
    if changed is null then
      changed := '{}';
    end if;
  elsif tg_op = 'DELETE' then
    previous_row := pg_catalog.to_jsonb(old);
    current_row := null;
    owner_id := (previous_row ->> 'user_id')::uuid;
    target_id := (previous_row ->> 'id')::uuid;
    changed := null;
  else
    raise exception 'operacao de auditoria nao suportada';
  end if;

  insert into private.audit_log (
    owner_user_id,
    actor_user_id,
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_fields
  ) values (
    owner_id,
    auth.uid(),
    tg_table_name,
    target_id,
    tg_op,
    previous_row,
    current_row,
    changed
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.audit_row_change() from public;
revoke all on function private.audit_row_change() from anon, authenticated;

create trigger entities_audit_row_change
after insert or update or delete on public.entities
for each row
execute function private.audit_row_change();

create trigger financial_accounts_audit_row_change
after insert or update or delete on public.financial_accounts
for each row
execute function private.audit_row_change();

create trigger payment_cards_audit_row_change
after insert or update or delete on public.payment_cards
for each row
execute function private.audit_row_change();

create trigger categories_audit_row_change
after insert or update or delete on public.categories
for each row
execute function private.audit_row_change();
