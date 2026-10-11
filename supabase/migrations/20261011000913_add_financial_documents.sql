create function private.set_financial_documents_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.set_financial_documents_updated_at() from public;
revoke all on function private.set_financial_documents_updated_at() from anon, authenticated;

create table public.financial_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  document_type text null,
  status text not null default 'RECEIVED',
  sha256 text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_documents_status_check check (
    status in ('RECEIVED','PROCESSING','EXTRACTED','CONFIRMED','PENDING','REJECTED','FAILED')
  ),
  constraint financial_documents_mime_check check (
    mime_type in ('image/jpeg', 'image/png', 'application/pdf')
  ),
  constraint financial_documents_size_check check (
    file_size_bytes > 0 and file_size_bytes <= 10485760
  ),
  constraint financial_documents_sha256_check check (sha256 ~ '^[0-9a-f]{64}$'),
  constraint financial_documents_filename_not_blank check (char_length(btrim(original_filename)) > 0),
  constraint financial_documents_path_not_blank check (char_length(btrim(storage_path)) > 0),
  constraint financial_documents_storage_path_key unique (storage_path)
);

create index financial_documents_user_created_idx
  on public.financial_documents (user_id, created_at desc);

create trigger financial_documents_set_updated_at
before update on public.financial_documents
for each row
execute function private.set_financial_documents_updated_at();

create trigger financial_documents_audit_row_change
after insert or update or delete on public.financial_documents
for each row
execute function private.audit_row_change();

alter table public.financial_documents enable row level security;

revoke all on table public.financial_documents from public;
revoke all on table public.financial_documents from anon;

grant select, insert on table public.financial_documents to authenticated;

create policy financial_documents_select_own
on public.financial_documents
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy financial_documents_insert_own
on public.financial_documents
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'RECEIVED'
  and storage_path like 'users/' || (select auth.uid())::text || '/%'
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'financial-documents',
  'financial-documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'application/pdf']
);

create policy financial_documents_storage_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'financial-documents'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy financial_documents_storage_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id = 'financial-documents'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);

create policy financial_documents_storage_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'financial-documents'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = (select auth.uid())::text
);