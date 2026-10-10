"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeAccountInput } from "@/lib/accounts/input";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : "";

  if (!userId) {
    redirect("/login");
  }

  return { supabase, userId };
}

function fail(code: "invalid" | "save"): never {
  redirect(`/app/accounts?error=${code}`);
}

export async function createAccount(formData: FormData) {
  const parsed = normalizeAccountInput({
    entityId: String(formData.get("entity_id") ?? ""),
    accountType: String(formData.get("account_type") ?? ""),
    name: String(formData.get("name") ?? ""),
    institutionName: String(formData.get("institution_name") ?? ""),
    lastFour: String(formData.get("last_four") ?? ""),
  });

  if (!parsed.ok) {
    fail("invalid");
  }

  const { supabase, userId } = await requireUser();
  const { data: entity } = await supabase
    .from("entities")
    .select("id")
    .eq("id", parsed.value.entityId)
    .maybeSingle();

  if (!entity) {
    fail("invalid");
  }

  const { error } = await supabase.from("financial_accounts").insert({
    user_id: userId,
    entity_id: parsed.value.entityId,
    name: parsed.value.name,
    institution_name: parsed.value.institutionName,
    account_type: parsed.value.accountType,
    last_four: parsed.value.lastFour,
  });

  if (error) {
    fail("save");
  }

  revalidatePath("/app/accounts");
  redirect("/app/accounts");
}

export async function renameAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = normalizeAccountInput({
    entityId: "kept",
    accountType: "CHECKING",
    name: String(formData.get("name") ?? ""),
  });

  if (!id || !parsed.ok) {
    fail("invalid");
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("financial_accounts")
    .update({ name: parsed.value.name })
    .eq("id", id);

  if (error) {
    fail("save");
  }

  revalidatePath("/app/accounts");
  redirect("/app/accounts");
}

export async function setAccountActive(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!id) {
    fail("invalid");
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("financial_accounts")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    fail("save");
  }

  revalidatePath("/app/accounts");
  redirect("/app/accounts");
}
