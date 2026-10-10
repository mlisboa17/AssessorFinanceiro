import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  classifyAuthError,
  classifySignup,
  emailFromVerifiedClaims,
  messageForAuthFailure,
} from "../src/lib/supabase/auth-messages.ts";
import { readSupabasePublicEnv } from "../src/lib/supabase/env.ts";

const authSources = [
  "src/lib/supabase/client.ts",
  "src/lib/supabase/server.ts",
  "src/lib/supabase/env.ts",
  "src/proxy.ts",
  "src/app/signup/actions.ts",
  "src/app/login/actions.ts",
  "src/app/app/actions.ts",
  "src/app/app/page.tsx",
];

test("a rota pública continua sem dado financeiro", () => {
  const page = readFileSync("src/app/page.tsx", "utf8");
  assert.equal(page.includes("HomeIntro"), true);
  assert.equal(page.includes("R$"), false);
});

test("clientes Supabase não usam chave secreta nem sessão não verificada", () => {
  const source = authSources.map((file) => readFileSync(file, "utf8")).join("\n");
  const clients = ["src/lib/supabase/client.ts", "src/lib/supabase/server.ts", "src/proxy.ts"]
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  assert.equal(source.includes("process.env.SUPABASE_SECRET_KEY"), false);
  assert.equal(source.includes('process.env["SUPABASE_SECRET_KEY"]'), false);
  assert.equal(clients.includes("service_role"), false);
  assert.equal(clients.includes("sb_secret_"), false);
  assert.equal(source.includes("getSession("), false);
  assert.equal(source.includes(".user_metadata"), false);
  assert.equal(source.includes("getClaims("), true);
  assert.equal(source.includes("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), true);
});

test("claims sem e-mail verificado não autorizam /app", () => {
  assert.equal(emailFromVerifiedClaims(null), null);
  assert.equal(emailFromVerifiedClaims({}), null);
  assert.equal(
    emailFromVerifiedClaims({
      user_metadata: { email: "pessoa@example.com", role: "admin" },
    }),
    null,
  );
  assert.equal(
    emailFromVerifiedClaims({ sub: "user-1", email: "pessoa@example.com" }),
    "pessoa@example.com",
  );
});

test("cadastro distingue sessão, confirmação de e-mail e e-mail já usado", () => {
  assert.deepEqual(
    classifySignup({ user: { identities: [{}] }, session: { present: true } }),
    { kind: "session" },
  );
  assert.deepEqual(
    classifySignup({ user: { identities: [{}] }, session: null }),
    { kind: "confirm_email" },
  );
  assert.deepEqual(
    classifySignup({ user: { identities: [] }, session: null }),
    { kind: "email_taken" },
  );
});

test("erros de auth viram mensagens seguras", () => {
  assert.equal(
    messageForAuthFailure(classifyAuthError({ code: "user_already_exists" })),
    "Este e-mail já está cadastrado. Entre com a senha ou use outro e-mail.",
  );
  assert.equal(
    messageForAuthFailure(classifyAuthError({ code: "weak_password" })),
    "A senha não atende aos requisitos. Use pelo menos 6 caracteres.",
  );
  assert.equal(
    messageForAuthFailure(classifyAuthError({ code: "invalid_credentials" })),
    "E-mail ou senha incorretos.",
  );
  assert.equal(
    messageForAuthFailure(classifyAuthError({ code: "unexpected_code", message: "raw token" })),
    "Não foi possível concluir agora. Tente de novo.",
  );
  assert.equal(
    messageForAuthFailure(classifyAuthError({ code: "unexpected_code", message: "raw token" })).includes(
      "raw token",
    ),
    false,
  );
});

test("a configuração pública recusa secret key e não exige secret para existir", () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_example";

  const env = readSupabasePublicEnv();
  assert.equal(env.url.endsWith(".supabase.co"), true);
  assert.equal(env.publishableKey.startsWith("sb_publishable_"), true);

  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_secret_example";
  assert.throws(() => readSupabasePublicEnv(), /secret key/);

  if (previousUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
  }
  if (previousKey === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});
