import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, readSession } from "@/lib/auth";

/**
 * Guards the admin portal and everything that bulk-exports content.
 *
 * `proxy.ts`, not `middleware.ts`: the middleware convention is deprecated in
 * Next 16 and renamed, though the behaviour is unchanged.
 *
 * Export routes are included on purpose. Protecting the page but leaving
 * /api/export open would be theatre — the download URL is guessable and
 * returns up to 5,000 articles per request against an origin that is already
 * fragile.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await readSession(token, process.env.AUTH_SECRET ?? "");

  // Already signed in and visiting the login page: send them onward.
  if (pathname === "/admin/login" || pathname === "/admin/login/") {
    if (session) {
      return NextResponse.redirect(new URL("/admin/", request.url));
    }
    return NextResponse.next();
  }

  if (session) return NextResponse.next();

  // API callers get a status they can act on, not an HTML login page.
  if (pathname.startsWith("/api/export")) {
    return NextResponse.json(
      { error: "Unauthorised. Sign in at /admin/login." },
      { status: 401 },
    );
  }

  const login = new URL("/admin/login/", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/export/:path*", "/archive/print/:path*"],
};
