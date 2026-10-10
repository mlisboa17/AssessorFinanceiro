-- pg_catalog.coalesce(text, text) não existe neste Postgres quando a função
-- auditora roda com search_path vazio. A comparação de colunas passa a percorrer
-- as chaves do snapshot, sem updated_at.

create or replace function private.audit_row_change()
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
  column_name text;
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
    changed := '{}';
    for column_name in
      select next_value.key
      from pg_catalog.jsonb_each(current_row) as next_value
      join pg_catalog.jsonb_each(previous_row) as previous_value
        on next_value.key = previous_value.key
      where next_value.key <> 'updated_at'
        and next_value.value is distinct from previous_value.value
      order by next_value.key
    loop
      changed := pg_catalog.array_append(changed, column_name);
    end loop;
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
