import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CACHE_TAGS } from "@/lib/wp";
import { clientKey, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Publish webhook. WordPress calls this when a post is saved so the article,
 * its category and the homepage go live in seconds instead of waiting for the
 * revalidate window.
 *
 * Wire it up in the theme's functions.php or a small mu-plugin:
 *
 *   add_action('save_post_post', function ($id, $post) {
 *     if ($post->post_status !== 'publish') return;
 *     wp_remote_post('https://SITE/api/revalidate', [
 *       'blocking' => false,
 *       'headers'  => ['Content-Type' => 'application/json'],
 *       'body'     => wp_json_encode([
 *         'secret' => REVALIDATE_SECRET,
 *         'slug'   => $post->post_name,
 *       ]),
 *     ]);
 *   }, 10, 2);
 */
export async function POST(request: Request) {
  // Generous enough for a busy newsroom, tight enough that the shared secret
  // cannot be brute-forced from one host.
  const limited = rateLimit(clientKey(request, "revalidate"), 120, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "Rate limited" },
      { status: 429, headers: rateLimitHeaders(limited) },
    );
  }

  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "REVALIDATE_SECRET is not configured" },
      { status: 500 },
    );
  }

  let body: { secret?: string; slug?: string; paths?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // Also accept the secret as a header, which is easier to set in some hosts.
  const provided = body.secret ?? request.headers.get("x-revalidate-secret");
  if (provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const revalidated: string[] = [];

  // Next 16 wants a cache-life profile. A publish must land immediately, so
  // the entry is expired outright rather than given a shortened life.
  const PURGE = { expire: 0 } as const;

  revalidateTag(CACHE_TAGS.posts, PURGE);
  revalidated.push(`tag:${CACHE_TAGS.posts}`);

  if (body.slug) {
    revalidateTag(CACHE_TAGS.post(body.slug), PURGE);
    revalidatePath(`/${body.slug}`);
    revalidated.push(`/${body.slug}`);
  }

  for (const p of body.paths ?? []) {
    revalidatePath(p);
    revalidated.push(p);
  }

  revalidatePath("/");
  revalidatePath("/latest");
  revalidated.push("/", "/latest");

  return NextResponse.json({ ok: true, revalidated, now: Date.now() });
}

export function GET() {
  return NextResponse.json(
    { ok: false, error: "Use POST" },
    { status: 405, headers: { Allow: "POST" } },
  );
}
