"use client";

import { useActionState } from "react";
import { signup } from "@/app/signup/actions";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, {
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
        autoComplete="new-password"
        required
      />
      {state.message ? (
        <p className="message" role="status">
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending}>
        Criar conta
      </button>
    </form>
  );
}
