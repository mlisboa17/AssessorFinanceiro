import { createBrowserClient } from "@supabase/ssr";
import { readSupabasePublicEnv } from "@/lib/supabase/env";

export function createClient() {
  const { url, publishableKey } = readSupabasePublicEnv();
  return createBrowserClient(url, publishableKey);
}
