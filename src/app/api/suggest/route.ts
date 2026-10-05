import { getPosts } from "@/lib/wp";
import { clientKey, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

/**
 * Type-ahead suggestions for the navbar search.
 *
 * Kept deliberately small: six results, titles and paths only. Every keystroke
 * that survives debouncing becomes a query against an origin that falls over
 * under load, so this is rate limited and fails quietly — an empty list is a
 * fine outcome for a suggestion box.
 */
export const runtime = "nodejs";

export async function GET(request: Request) {
  const limited = rateLimit(clientKey(request, "suggest"), 40, 60_000);
  if (!limited.ok) {
    return Response.json(
      { items: [] },
      { status: 429, headers: rateLimitHeaders(limited) },
    );
  }

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return Response.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const { items } = await getPosts({ search: q, perPage: 6 });
    return Response.json(
      {
        items: items.map((a) => ({
          id: a.id,
          title: a.title,
          path: a.path,
          category: a.categories[0]?.name ?? null,
          image: a.image?.src ?? null,
        })),
      },
      {
        headers: {
          // Short shared cache: repeated prefixes are common while typing.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          ...rateLimitHeaders(limited),
        },
      },
    );
  } catch {
    return Response.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
