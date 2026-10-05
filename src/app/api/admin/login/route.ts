import { NextResponse } from "next/server";
import { SESSION_COOKIE, cookieOptions, createSession, safeEqual } from "@/lib/auth";
import { clientKey, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Credentials come from the environment. There is no user table: this guards a
 * reporting tool for a newsroom, and a database of two accounts would be more
 * to operate than it is worth.
 */
export async function POST(request: Request) {
  // Ten attempts a minute per IP. Without a limit the scheme reduces to how
  // fast someone can POST; with five, a newsroom sharing one office IP can
  // lock itself out on a bad morning.
  const limited = rateLimit(clientKey(request, "login"), 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "ਬਹੁਤ ਸਾਰੀਆਂ ਕੋਸ਼ਿਸ਼ਾਂ। ਕੁਝ ਦੇਰ ਬਾਅਦ ਕੋਸ਼ਿਸ਼ ਕਰੋ।" },
      { status: 429, headers: rateLimitHeaders(limited) },
    );
  }

  const secret = process.env.AUTH_SECRET;
  const user = process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASSWORD;

  if (!secret || !user || !pass) {
    return NextResponse.json(
      { error: "Admin login is not configured on this deployment." },
      { status: 500 },
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Both comparisons always run, so a wrong username and a wrong password
  // take the same time and cannot be told apart.
  const userOk = safeEqual(body.username ?? "", user);
  const passOk = safeEqual(body.password ?? "", pass);

  if (!userOk || !passOk) {
    return NextResponse.json(
      { error: "ਗ਼ਲਤ ਯੂਜ਼ਰਨੇਮ ਜਾਂ ਪਾਸਵਰਡ।" },
      { status: 401 },
    );
  }

  const token = await createSession(user, secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    SESSION_COOKIE,
    token,
    cookieOptions(new URL(request.url).protocol === "https:"),
  );
  return res;
}
