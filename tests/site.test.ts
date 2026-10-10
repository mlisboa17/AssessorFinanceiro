import assert from "node:assert/strict";
import { test } from "node:test";
import { site } from "../src/lib/site.ts";

test("a página inicial identifica o produto e não mostra dado financeiro", () => {
  assert.equal(site.productName, "Assessor Financeiro");
  assert.equal(
    site.productSummary,
    "Registre, organize e revise suas despesas pessoais e empresariais.",
  );
  assert.equal(site.projectState, "Projeto em configuração");

  const copy = `${site.productName} ${site.productSummary} ${site.projectState}`;
  assert.equal(copy.includes("R$"), false);
  assert.equal(/\d/.test(copy), false);
});
