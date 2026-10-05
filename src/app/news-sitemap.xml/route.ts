import { getPosts } from "@/lib/wp";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

/**
 * Google News sitemap.
 *
 * The live site publishes one via Yoast News and it is how Google News and
 * Discover pick this publisher up, so dropping it in the migration would cost
 * real traffic. Google only accepts articles from the last 48 hours here.
 *
 * Two things the current one gets wrong, fixed below: its <news:name> is empty,
 * and it declares the language as "en" when the content is Punjabi.
 */
export const revalidate = 300;

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const cutoff = Date.now() - 48 * 3_600_000;

  let recent: Awaited<ReturnType<typeof getPosts>>["items"] = [];
  try {
    const { items } = await getPosts({ perPage: 100 });
    recent = items.filter((a) => new Date(a.date).getTime() >= cutoff);
  } catch {
    recent = [];
  }

  const urls = recent
    .map(
      (a) => `  <url>
    <loc>${SITE_URL}${a.path}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(SITE_NAME)}</news:name>
        <news:language>pa</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.date).toISOString()}</news:publication_date>
      <news:title>${xmlEscape(a.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
