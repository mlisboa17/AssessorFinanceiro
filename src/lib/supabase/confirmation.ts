const confirmationFailure = "/login?error=confirmation";

export function confirmationRedirect(input: {
  hasCode: boolean;
  exchangeSucceeded: boolean;
}): "/app" | "/login?error=confirmation" {
  if (input.hasCode && input.exchangeSucceeded) {
    return "/app";
  }

  return confirmationFailure;
}

export function shouldForwardAuthCode(pathname: string, hasCode: boolean): boolean {
  return hasCode && pathname !== "/auth/callback";
}

export function emailConfirmationRedirect(origin: string): string | null {
  let url: URL;

  try {
    url = new URL(origin);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  if (url.username || url.password || !url.host) {
    return null;
  }

  url.pathname = "/auth/callback";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function requestOrigin(headerStore: {
  get(name: string): string | null;
}): string | null {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const firstHost = host?.split(",")[0]?.trim() ?? "";

  if (!firstHost || /[\s/\\]/.test(firstHost)) {
    return null;
  }

  const forwardedProto = headerStore.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const local =
    firstHost.startsWith("localhost") ||
    firstHost.startsWith("127.0.0.1") ||
    firstHost.startsWith("[::1]");
  const proto = forwardedProto || (local ? "http" : "https");

  if (proto !== "http" && proto !== "https") {
    return null;
  }

  return emailConfirmationRedirect(`${proto}://${firstHost}`);
}
