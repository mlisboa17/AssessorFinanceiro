"use client";

import { useActionState } from "react";
import { login } from "@/app/login/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, {
    message: null,
  });

  return (
    <form action={formAction} className="auth-form">
      <label htmlFor="email">E-mail</label>
      <input id="email" name="email" type="email" autoComplete="email" required />
      <label htmlFor="password">Senha</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {state.message ? (
        <p className="message" role="status">
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending}>
        Entrar
      </button>
    </form>
  );
}
