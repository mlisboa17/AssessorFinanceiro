export type AuthFailure =
  | "email_taken"
  | "invalid_password"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "unexpected";

export type AuthFormState = {
  message: string | null;
};

export type SignupClassification =
  | { kind: "session" }
  | { kind: "confirm_email" }
  | { kind: "email_taken" };

const messages: Record<AuthFailure, string> = {
  email_taken:
    "Este e-mail já está cadastrado. Entre com a senha ou use outro e-mail.",
  invalid_password:
    "A senha não atende aos requisitos. Use pelo menos 6 caracteres.",
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme o e-mail antes de entrar.",
  unexpected: "Não foi possível concluir agora. Tente de novo.",
};

export function messageForAuthFailure(failure: AuthFailure): string {
  return messages[failure];
}

export function classifyAuthError(error: {
  code?: string | null;
  message?: string | null;
}): AuthFailure {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  if (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    return "email_taken";
  }

  if (code === "invalid_credentials" || message.includes("invalid login")) {
    return "invalid_credentials";
  }

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "email_not_confirmed";
  }

  if (
    code === "weak_password" ||
    code === "validation_failed" ||
    message.includes("password should be")
  ) {
    return "invalid_password";
  }

  return "unexpected";
}

export function classifySignup(result: {
  user: { identities?: unknown[] | null } | null;
  session: unknown | null;
}): SignupClassification | { kind: "failure" } {
  if (result.session) {
    return { kind: "session" };
  }

  const identities = result.user?.identities;
  if (result.user && Array.isArray(identities) && identities.length === 0) {
    return { kind: "email_taken" };
  }

  if (result.user) {
    return { kind: "confirm_email" };
  }

  return { kind: "failure" };
}

export function emailFromVerifiedClaims(
  claims: Record<string, unknown> | null | undefined,
): string | null {
  if (!claims) {
    return null;
  }

  if (typeof claims.sub !== "string" || claims.sub.length === 0) {
    return null;
  }

  if (typeof claims.email !== "string" || claims.email.length === 0) {
    return null;
  }

  return claims.email;
}
