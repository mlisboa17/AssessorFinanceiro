import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { normalizeCardInput } from "../src/lib/cards/input.ts";
import { isProtectedAppPath } from "../src/lib/supabase/routes.ts";

test("rejeita nome vazio e entidade ausente", () => {
  assert.equal(
    normalizeCardInput({ entityId: "entity-1", name: "  ", lastFour: "4482" }).ok,
    false,
  );
  assert.equal(
    normalizeCardInput({ entityId: " ", name: "Cartão A", lastFour: "4482" }).ok,
    false,
  );
});

test("exige exatamente quatro dígitos no cartão", () => {
  assert.equal(
    normalizeCardInput({ entityId: "entity-1", name: "Cartão A", lastFour: "482" }).ok,
    false,
  );
  assert.equal(
    normalizeCardInput({ entityId: "entity-1", name: "Cartão A", lastFour: "44821" }).ok,
    false,
  );
  assert.equal(
    normalizeCardInput({ entityId: "entity-1", name: "Cartão A", lastFour: "44ab" }).ok,
    false,
  );
  assert.equal(
    normalizeCardInput({ entityId: "entity-1", name: "Cartão A", lastFour: "" }).ok,
    false,
  );

  const parsed = normalizeCardInput({
    entityId: "entity-1",
    name: " Cartão A ",
    issuerName: " Banco ",
    brand: " Visa ",
    lastFour: "44-82",
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.name, "Cartão A");
    assert.equal(parsed.value.issuerName, "Banco");
    assert.equal(parsed.value.brand, "Visa");
    assert.equal(parsed.value.lastFour, "4482");
  }
});

test("o cadastro do cartão não recebe user_id do client", () => {
  const source = [
    readFileSync("src/lib/cards/input.ts", "utf8"),
    readFileSync("src/app/app/cards/actions.ts", "utf8"),
  ].join("\n");

  assert.equal(source.includes('formData.get("user_id")'), false);
  assert.equal(source.includes("SUPABASE_SECRET_KEY"), false);
  assert.equal(source.includes(".user_metadata"), false);
  assert.equal(source.includes("data?.claims?.sub"), true);
  assert.equal(source.includes('.from("entities")'), true);
  assert.equal(source.includes('formData.get("entity_id")'), true);
});

test("a migration do cartão não guarda pan e não abre para anon", () => {
  const sql = readFileSync(
    "supabase/migrations/20261010195234_add_financial_accounts_and_payment_cards.sql",
    "utf8",
  ).toLowerCase();

  assert.equal(sql.includes("create table public.payment_cards"), true);
  assert.equal(sql.includes("last_four text not null"), true);
  assert.equal(sql.includes("cvv"), false);
  assert.equal(sql.includes("pan"), false);
  assert.equal(
    sql.includes("grant select, insert, update on table public.payment_cards to authenticated"),
    true,
  );
  assert.equal(sql.includes("to anon"), false);
  assert.equal(sql.includes("for delete"), false);
  assert.equal(sql.includes("(select auth.uid()) = user_id"), true);
});

test("visitante sem sessão não entra em /app/cards", () => {
  assert.equal(isProtectedAppPath("/app/cards"), true);
});
