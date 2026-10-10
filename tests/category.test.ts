import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { categorySlug, normalizeCategoryInput } from "../src/lib/categories/input.ts";
import { isProtectedAppPath } from "../src/lib/supabase/routes.ts";

const migration = readFileSync(
  "supabase/migrations/20261010202808_add_financial_categories.sql",
  "utf8",
).toLowerCase();

test("aceita despesa, receita e transferência", () => {
  for (const kind of ["EXPENSE", "INCOME", "TRANSFER"]) {
    assert.equal(normalizeCategoryInput({ kind, name: "Categoria A" }).ok, true);
  }
});

test("rejeita tipo inválido e nome vazio", () => {
  assert.equal(normalizeCategoryInput({ kind: "fee", name: "Taxa" }).ok, false);
  assert.equal(normalizeCategoryInput({ kind: "EXPENSE", name: "   " }).ok, false);
  assert.equal(normalizeCategoryInput({ kind: "EXPENSE", name: "!!!" }).ok, false);
});

test("deriva slug estável sem acento", () => {
  assert.equal(categorySlug("Combustível"), "combustivel");
  assert.equal(categorySlug("Distribuição de lucros"), "distribuicao-de-lucros");
  assert.equal(categorySlug("  Pró-labore "), "pro-labore");

  const parsed = normalizeCategoryInput({ kind: "INCOME", name: " Distribuição de lucros " });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.slug, "distribuicao-de-lucros");
    assert.equal(parsed.value.name, "Distribuição de lucros");
  }
});

test("o cadastro não recebe user_id nem is_system do client", () => {
  const source = [
    readFileSync("src/lib/categories/input.ts", "utf8"),
    readFileSync("src/app/app/categories/actions.ts", "utf8"),
  ].join("\n");

  assert.equal(source.includes('formData.get("user_id")'), false);
  assert.equal(source.includes('formData.get("is_system")'), false);
  assert.equal(source.includes('formData.get("slug")'), false);
  assert.equal(source.includes("SUPABASE_SECRET_KEY"), false);
  assert.equal(source.includes(".user_metadata"), false);
  assert.equal(source.includes("data?.claims?.sub"), true);
  assert.equal(source.includes("is_system: false"), true);
});

test("a migration separa categoria de sistema e do usuário", () => {
  assert.equal(migration.includes("enable row level security"), true);
  assert.equal(migration.includes("is_system = true"), true);
  assert.equal(migration.includes("(select auth.uid()) = user_id"), true);
  assert.equal(migration.includes("and is_system = false"), true);
  assert.equal(migration.includes("with check"), true);
  assert.equal(
    migration.includes("grant select, insert, update on table public.categories to authenticated"),
    true,
  );
  assert.equal(migration.includes("to anon"), false);
  assert.equal(migration.includes("for delete"), false);
  assert.equal(migration.includes("(is_system = true and user_id is null)"), true);
  assert.equal(migration.includes("(is_system = false and user_id is not null)"), true);
  assert.equal(migration.includes("parent_id is null or parent_id <> id"), true);
  assert.equal(migration.includes("where is_system = true"), true);
  assert.equal(migration.includes("where is_system = false and is_active = true"), true);
  assert.equal(migration.includes("on conflict (kind, slug) where is_system = true do nothing"), true);
  assert.equal(migration.includes("'combustivel'"), true);
  assert.equal(migration.includes("'distribuicao-de-lucros'"), true);
  assert.equal(migration.includes("'transferencia-entre-contas'"), true);
});

test("visitante sem sessão não entra em /app/categories", () => {
  assert.equal(isProtectedAppPath("/app/categories"), true);
  assert.equal(isProtectedAppPath("/login"), false);
});
