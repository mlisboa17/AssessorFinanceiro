"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeCardInput } from "@/lib/cards/input";
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
  redirect(`/app/cards?error=${code}`);
}

export async function createCard(formData: FormData) {
  const parsed = normalizeCardInput({
    entityId: String(formData.get("entity_id") ?? ""),
    name: String(formData.get("name") ?? ""),
    issuerName: String(formData.get("issuer_name") ?? ""),
    brand: String(formData.get("brand") ?? ""),
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

  const { error } = await supabase.from("payment_cards").insert({
    user_id: userId,
    entity_id: parsed.value.entityId,
    name: parsed.value.name,
    issuer_name: parsed.value.issuerName,
    brand: parsed.value.brand,
    last_four: parsed.value.lastFour,
  });

  if (error) {
    fail("save");
  }

  revalidatePath("/app/cards");
  redirect("/app/cards");
}

export async function renameCard(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = normalizeCardInput({
    entityId: "kept",
    name: String(formData.get("name") ?? ""),
    lastFour: "0000",
  });

  if (!id || !parsed.ok) {
    fail("invalid");
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("payment_cards")
    .update({ name: parsed.value.name })
    .eq("id", id);

  if (error) {
    fail("save");
  }

  revalidatePath("/app/cards");
  redirect("/app/cards");
}

export async function setCardActive(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!id) {
    fail("invalid");
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("payment_cards")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    fail("save");
  }

  revalidatePath("/app/cards");
  redirect("/app/cards");
}
