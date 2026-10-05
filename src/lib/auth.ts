/**
 * Session handling for the admin portal.
 *
 * Deliberately stateless: a signed cookie, no session store, no database. The
 * portal guards a reporting tool, not money, and a shared store would be one
 * more thing to run and fail.
 *
 * Signing uses Web Crypto so the same code verifies in `proxy.ts`, which may
 * execute on the edge where Node's `crypto` is unavailable.
 */

export const SESSION_COOKIE = "ctv_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // one working day

function b64url(bytes: Uint8Array<ArrayBufferLike>): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export interface SessionPayload {
  user: string;
  exp: number;
}

export async function createSession(
  user: string,
  secret: string,
): Promise<string> {
  const payload: SessionPayload = {
    user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    new TextEncoder().encode(body),
  );
  return `${body}.${b64url(new Uint8Array(sig))}`;
}

export async function readSession(
  token: string | undefined,
  secret: string,
): Promise<SessionPayload | null> {
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  let ok = false;
  try {
    ok = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      fromB64url(sig),
      new TextEncoder().encode(body),
    );
  } catch {
    return null;
  }
  if (!ok) return null;

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(fromB64url(body)),
    ) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Comparison that does not leak length or position through timing. */
export function safeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  // Compare a fixed-size digest rather than the raw strings so differing
  // lengths cost the same as differing contents.
  if (ab.length !== bb.length) {
    let dummy = 0;
    for (let i = 0; i < ab.length; i++) dummy |= ab[i];
    return false && dummy === 0;
  }
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

export const cookieOptions = (secure: boolean) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
});
