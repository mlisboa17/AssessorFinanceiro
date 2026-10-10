const publicUrlName = "NEXT_PUBLIC_SUPABASE_URL";
const publicKeyName = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export function readSupabasePublicEnv(): { url: string; publishableKey: string } {
  const url = process.env[publicUrlName];
  const publishableKey = process.env[publicKeyName];

  if (!url || !publishableKey) {
    throw new Error("Supabase public environment is not configured.");
  }

  if (
    publishableKey.startsWith("sb_secret_") ||
    publishableKey.includes("service_role")
  ) {
    throw new Error("Supabase client refused a secret key.");
  }

  return { url, publishableKey };
}
