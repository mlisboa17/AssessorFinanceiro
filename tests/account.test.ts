import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { normalizeAccountInput } from "../src/lib/accounts/input.ts";
import { isProtectedAppPath } from "../src/lib/supabase/routes.ts";

const migration = readFileSync(
  "supabase/migrations/20261010195234_add_financial_accounts_and_payment_cards.sql",
  "utf8",
).toLowerCase();

test("aceita os tipos de conta do mvp", () => {
  for (const accountType of ["CHECKING", "SAVINGS", "DIGITAL", "CASH", "OTHER"]) {
    const parsed = normalizeAccountInput({
      entityId: "entity-1",
      accountType,
      name: "Conta A",
    });
    assert.equal(parsed.ok, true);
  }
});

test("rejeita tipo inválido, nome vazio e entidade ausente", () => {
  assert.equal(
    normalizeAccountInput({ entityId: "entity-1", accountType: "bank", name: "Conta A" }).ok,
    false,
  );
  assert.equal(
    normalizeAccountInput({ entityId: "entity-1", accountType: "CHECKING", name: "   " }).ok,
    false,
  );
  assert.equal(
    normalizeAccountInput({ entityId: "  ", accountType: "CHECKING", name: "Conta A" }).ok,
    false,
  );
});

test("aceita final vazio e rejeita final fora de quatro dígitos", () => {
  const empty = normalizeAccountInput({
    entityId: "entity-1",
    accountType: "CHECKING",
    name: "Conta A",
    lastFour: "  ",
  });
  assert.equal(empty.ok, true);
  if (empty.ok) {
    assert.equal(empty.value.lastFour, null);
  }

  const masked = normalizeAccountInput({
    entityId: "entity-1",
    accountType: "DIGITAL",
    name: " Conta A ",
    institutionName: "  Nubank  ",
    lastFour: "44-82",
  });
  assert.equal(masked.ok, true);
  if (masked.ok) {
    assert.equal(masked.value.name, "Conta A");
    assert.equal(masked.value.institutionName, "Nubank");
    assert.equal(masked.value.lastFour, "4482");
  }

  assert.equal(
    normalizeAccountInput({
      entityId: "entity-1",
      accountType: "CHECKING",
      name: "Conta A",
      lastFour: "482",
    }).ok,
    false,
  );
  assert.equal(
    normalizeAccountInput({
      entityId: "entity-1",
      accountType: "CHECKING",
      name: "Conta A",
      lastFour: "44821",
    }).ok,
    false,
  );
  assert.equal(
    normalizeAccountInput({
      entityId: "entity-1",
      accountType: "CHECKING",
      name: "Conta A",
      lastFour: "abcd",
    }).ok,
    false,
  );
});

test("o cadastro da conta não recebe user_id do client", () => {
  const source = [
    readFileSync("src/lib/accounts/input.ts", "utf8"),
    readFileSync("src/app/app/accounts/actions.ts", "utf8"),
  ].join("\n");

  assert.equal(source.includes('formData.get("user_id")'), false);
  assert.equal(source.includes("SUPABASE_SECRET_KEY"), false);
  assert.equal(source.includes(".user_metadata"), false);
  assert.equal(source.includes("data?.claims?.sub"), true);
  assert.equal(source.includes('.from("entities")'), true);
  assert.equal(source.includes('formData.get("entity_id")'), true);
});

test("a migration da conta isola o dono e a entidade", () => {
  assert.equal(migration.includes("enable row level security"), true);
  assert.equal(migration.includes("(select auth.uid()) = user_id"), true);
  assert.equal(migration.includes("with check"), true);
  assert.equal(
    migration.includes(
      "grant select, insert, update on table public.financial_accounts to authenticated",
    ),
    true,
  );
  assert.equal(migration.includes("to anon"), false);
  assert.equal(migration.includes("for delete"), false);
  assert.equal(migration.includes("foreign key (entity_id, user_id)"), true);
  assert.equal(migration.includes("references public.entities (id, user_id)"), true);
  assert.equal(migration.includes("revoke truncate, references, trigger"), true);

  const ownerKey = readFileSync(
    "supabase/migrations/20261010195231_add_entity_owner_key.sql",
    "utf8",
  ).toLowerCase();
  assert.equal(ownerKey.includes("unique (id, user_id)"), true);
});

test("visitante sem sessão não entra em /app/accounts", () => {
  assert.equal(isProtectedAppPath("/app/accounts"), true);
  assert.equal(isProtectedAppPath("/login"), false);
});
