import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { emailFromVerifiedClaims } from "@/lib/supabase/auth-messages";
import { shouldForwardAuthCode } from "@/lib/supabase/confirmation";
import { readSupabasePublicEnv } from "@/lib/supabase/env";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, publishableKey } = readSupabasePublicEnv();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const email = emailFromVerifiedClaims(data?.claims ?? null);
  const hasCode = request.nextUrl.searchParams.has("code");

  if (shouldForwardAuthCode(request.nextUrl.pathname, hasCode)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/callback";
    const redirectResponse = NextResponse.redirect(redirectUrl);
    copySessionCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  const isApp = request.nextUrl.pathname === "/app" || request.nextUrl.pathname.startsWith("/app/");

  if (!email && isApp) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    const redirectResponse = NextResponse.redirect(redirectUrl);
    copySessionCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}

function copySessionCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) {
      target.headers.set(header, value);
    }
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
