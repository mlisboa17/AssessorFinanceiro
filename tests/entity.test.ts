import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { normalizeEntityInput } from "../src/lib/entities/input.ts";
import { isProtectedAppPath } from "../src/lib/supabase/routes.ts";

test("aceita pessoa física e empresa", () => {
  assert.equal(normalizeEntityInput({ type: "PERSON", name: "Pessoa A" }).ok, true);
  assert.equal(normalizeEntityInput({ type: "COMPANY", name: "Empresa A" }).ok, true);
});

test("rejeita tipo inválido e nome vazio", () => {
  assert.equal(normalizeEntityInput({ type: "bank", name: "Conta" }).ok, false);
  assert.equal(normalizeEntityInput({ type: "PERSON", name: "   " }).ok, false);
});

test("guarda documento só com dígitos", () => {
  const parsed = normalizeEntityInput({
    type: "PERSON",
    name: "Pessoa A",
    documentNumber: "123.456.789-00",
  });

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.documentNumber, "12345678900");
  }

  const empty = normalizeEntityInput({
    type: "COMPANY",
    name: "Empresa A",
    documentNumber: "sem número",
  });
  assert.equal(empty.ok, true);
  if (empty.ok) {
    assert.equal(empty.value.documentNumber, null);
  }
});

test("o cadastro não recebe user_id do client", () => {
  const source = [
    readFileSync("src/lib/entities/input.ts", "utf8"),
    readFileSync("src/app/app/entities/actions.ts", "utf8"),
  ].join("\n");

  assert.equal(source.includes('formData.get("user_id")'), false);
  assert.equal(source.includes("SUPABASE_SECRET_KEY"), false);
  assert.equal(source.includes(".user_metadata"), false);
  assert.equal(source.includes("data.claims.sub") || source.includes("data?.claims?.sub"), true);
});

test("a migration isola a linha e não abre a tabela para anon", () => {
  const sql = readFileSync(
    "supabase/migrations/20261010192500_add_financial_entities.sql",
    "utf8",
  ).toLowerCase();

  assert.equal(sql.includes("enable row level security"), true);
  assert.equal(sql.includes("(select auth.uid()) = user_id"), true);
  assert.equal(sql.includes("with check"), true);
  assert.equal(sql.includes("grant select, insert, update on table public.entities to authenticated"), true);
  assert.equal(sql.includes("to anon"), false);
  assert.equal(sql.includes("for delete"), false);

  const grants = readFileSync(
    "supabase/migrations/20261010192753_restrict_entities_grants.sql",
    "utf8",
  ).toLowerCase();
  assert.equal(grants.includes("revoke truncate, references, trigger"), true);
});

test("visitante sem sessão não entra em /app/entities", () => {
  assert.equal(isProtectedAppPath("/app/entities"), true);
  assert.equal(isProtectedAppPath("/login"), false);
});
