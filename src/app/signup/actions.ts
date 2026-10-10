"use server";

import { redirect } from "next/navigation";
import {
  classifyAuthError,
  classifySignup,
  messageForAuthFailure,
  type AuthFormState,
} from "@/lib/supabase/auth-messages";
import { createClient } from "@/lib/supabase/server";

export async function signup(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { message: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { message: messageForAuthFailure(classifyAuthError(error)) };
  }

  const outcome = classifySignup({
    user: data.user,
    session: data.session,
  });

  if (outcome.kind === "session") {
    redirect("/app");
  }

  if (outcome.kind === "email_taken") {
    return { message: messageForAuthFailure("email_taken") };
  }

  if (outcome.kind === "confirm_email") {
    return {
      message: "Conta criada. Confirme o e-mail antes de entrar.",
    };
  }

  return { message: messageForAuthFailure("unexpected") };
}
