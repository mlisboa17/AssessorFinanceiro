"use server";

import { redirect } from "next/navigation";
import {
  classifyAuthError,
  messageForAuthFailure,
  type AuthFormState,
} from "@/lib/supabase/auth-messages";
import { createClient } from "@/lib/supabase/server";

export async function login(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { message: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: messageForAuthFailure(classifyAuthError(error)) };
  }

  redirect("/app");
}
