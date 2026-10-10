"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeEntityInput } from "@/lib/entities/input";
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
  redirect(`/app/entities?error=${code}`);
}

export async function createEntity(formData: FormData) {
  const parsed = normalizeEntityInput({
    type: String(formData.get("type") ?? ""),
    name: String(formData.get("name") ?? ""),
    documentNumber: String(formData.get("document_number") ?? ""),
  });

  if (!parsed.ok) {
    fail("invalid");
  }

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("entities").insert({
    user_id: userId,
    type: parsed.value.type,
    name: parsed.value.name,
    document_number: parsed.value.documentNumber,
  });

  if (error) {
    fail("save");
  }

  revalidatePath("/app/entities");
  redirect("/app/entities");
}

export async function renameEntity(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = normalizeEntityInput({
    type: "PERSON",
    name: String(formData.get("name") ?? ""),
  });

  if (!id || !parsed.ok) {
    fail("invalid");
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("entities")
    .update({ name: parsed.value.name })
    .eq("id", id);

  if (error) {
    fail("save");
  }

  revalidatePath("/app/entities");
  redirect("/app/entities");
}

export async function setEntityActive(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!id) {
    fail("invalid");
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("entities")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    fail("save");
  }

  revalidatePath("/app/entities");
  redirect("/app/entities");
}
