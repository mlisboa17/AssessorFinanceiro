export function isProtectedAppPath(pathname: string): boolean {
  return pathname === "/app" || pathname.startsWith("/app/");
}
