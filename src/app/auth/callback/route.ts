import { redirect } from "next/navigation";
import { confirmationRedirect } from "@/lib/supabase/confirmation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  let exchangeSucceeded = false;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeSucceeded = !error;
  }

  redirect(confirmationRedirect({ hasCode: Boolean(code), exchangeSucceeded }));
}
