import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  confirmationRedirect,
  emailConfirmationRedirect,
  requestOrigin,
  shouldForwardAuthCode,
} from "../src/lib/supabase/confirmation.ts";

test("callback sem code volta ao login sem dado sensível", () => {
  const destination = confirmationRedirect({
    hasCode: false,
    exchangeSucceeded: false,
  });

  assert.equal(destination, "/login?error=confirmation");
  assert.equal(destination.includes("code="), false);
});

test("falha ao trocar o code volta ao login", () => {
  assert.equal(
    confirmationRedirect({ hasCode: true, exchangeSucceeded: false }),
    "/login?error=confirmation",
  );
});

test("troca bem-sucedida abre a área autenticada", () => {
  assert.equal(
    confirmationRedirect({ hasCode: true, exchangeSucceeded: true }),
    "/app",
  );
});

test("o retorno local do cadastro aponta para o callback", () => {
  assert.equal(
    requestOrigin({
      get(name: string) {
        if (name === "host") return "localhost:3000";
        return null;
      },
    }),
    "http://localhost:3000/auth/callback",
  );
  assert.equal(emailConfirmationRedirect("javascript:alert(1)"), null);
  assert.equal(emailConfirmationRedirect("https://user:secret@example.com"), null);
});

test("um code fora do callback é encaminhado para a troca de sessão", () => {
  assert.equal(shouldForwardAuthCode("/", true), true);
  assert.equal(shouldForwardAuthCode("/auth/callback", true), false);
  assert.equal(shouldForwardAuthCode("/login", false), false);
});

test("o callback não usa secret key nem registra o code", () => {
  const source = readFileSync("src/app/auth/callback/route.ts", "utf8");
  assert.equal(source.includes("exchangeCodeForSession"), true);
  assert.equal(source.includes("SUPABASE_SECRET_KEY"), false);
  assert.equal(source.includes("service_role"), false);
  assert.equal(source.includes("console."), false);
  assert.equal(source.includes(".user_metadata"), false);
});
