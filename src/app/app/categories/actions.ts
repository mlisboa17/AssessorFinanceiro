"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeCategoryInput } from "@/lib/categories/input";
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
  redirect(`/app/categories?error=${code}`);
}

export async function createCategory(formData: FormData) {
  const parsed = normalizeCategoryInput({
    kind: String(formData.get("kind") ?? ""),
    name: String(formData.get("name") ?? ""),
  });

  if (!parsed.ok) {
    fail("invalid");
  }

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("categories").insert({
    user_id: userId,
    name: parsed.value.name,
    slug: parsed.value.slug,
    kind: parsed.value.kind,
    is_system: false,
  });

  if (error) {
    fail("save");
  }

  revalidatePath("/app/categories");
  redirect("/app/categories");
}

export async function renameCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const parsed = normalizeCategoryInput({
    kind: "EXPENSE",
    name: String(formData.get("name") ?? ""),
  });

  if (!id || !parsed.ok) {
    fail("invalid");
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.value.name, slug: parsed.value.slug })
    .eq("id", id);

  if (error) {
    fail("save");
  }

  revalidatePath("/app/categories");
  redirect("/app/categories");
}

export async function setCategoryActive(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";

  if (!id) {
    fail("invalid");
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    fail("save");
  }

  revalidatePath("/app/categories");
  redirect("/app/categories");
}
