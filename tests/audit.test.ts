import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const created = readFileSync(
  "supabase/migrations/20261010231300_add_data_core_audit_log.sql",
  "utf8",
).toLowerCase();
const fixed = readFileSync(
  "supabase/migrations/20261010231629_fix_audit_changed_fields.sql",
  "utf8",
).toLowerCase();

test("a migration cria a trilha no schema private", () => {
  assert.equal(created.includes("create table private.audit_log"), true);
  assert.equal(created.includes("create table public.audit_log"), false);
  assert.equal(created.includes("owner_user_id uuid null"), true);
  assert.equal(created.includes("actor_user_id uuid null"), true);
  assert.equal(created.includes("operation in ('insert', 'update', 'delete')"), true);
  assert.equal(created.includes("enable row level security"), true);
  assert.equal(created.includes("audit_log_owner_created_idx"), true);
  assert.equal(created.includes("audit_log_record_created_idx"), true);
});

test("a função auditora fica privada e não abre execute", () => {
  assert.equal(created.includes("create function private.audit_row_change()"), true);
  assert.equal(created.includes("security definer"), true);
  assert.equal(created.includes("set search_path = ''"), true);
  assert.equal(created.includes("revoke all on function private.audit_row_change() from public"), true);
  assert.equal(
    created.includes("revoke all on function private.audit_row_change() from anon, authenticated"),
    true,
  );
  assert.equal(created.includes("create function public.audit_row_change"), false);
  assert.equal(created.includes("grant insert") && created.includes("audit_log"), false);
  assert.equal(created.includes("grant select, insert, update on table private.audit_log"), false);
});

test("as quatro tabelas de cadastro disparam a mesma auditoria", () => {
  for (const table of ["entities", "financial_accounts", "payment_cards", "categories"]) {
    assert.equal(created.includes(`after insert or update or delete on public.${table}`), true);
    assert.equal(created.includes(`${table}_audit_row_change`), true);
  }
  assert.equal(created.includes("execute function private.audit_row_change()"), true);
});

test("changed_fields ignora updated_at", () => {
  assert.equal(fixed.includes("next_value.key <> 'updated_at'"), true);
  assert.equal(fixed.includes("pg_catalog.array_append"), true);
  assert.equal(fixed.includes("auth.uid()"), true);
  assert.equal(fixed.includes("security definer"), true);
  assert.equal(fixed.includes("set search_path = ''"), true);
  assert.equal(
    fixed.includes("revoke all on function private.audit_row_change() from anon, authenticated"),
    true,
  );
});
