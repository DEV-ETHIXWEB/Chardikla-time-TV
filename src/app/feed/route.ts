import { getPosts } from "@/lib/wp";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";

/**
 * RSS 2.0 feed, replacing WordPress's own /feed/. Aggregators and a number of
 * Punjabi news apps pull this, so the URL has to keep working after cutover.
 *
 * Excerpt-only by design. Full bodies would mean dropping LIST_FIELDS and
 * pulling ~3MB per request from an origin that already falls over under load,
 * and a summary feed sends readers to the site rather than away from it.
 */
export const revalidate = 300;

function cdata(s: string): string {
  return `<![CDATA[${s.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

export async function GET() {
  let items: Awaited<ReturnType<typeof getPosts>>["items"] = [];
  try {
    items = (await getPosts({ perPage: 30 })).items;
  } catch {
    items = [];
  }

  const entries = items
    .map((a) => {
      const url = `${SITE_URL}${a.path}`;
      return `    <item>
      <title>${cdata(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(a.date).toUTCString()}</pubDate>
      ${a.categories[0] ? `<category>${cdata(a.categories[0].name)}</category>` : ""}
      <description>${cdata(a.excerpt)}</description>
      ${a.image ? `<enclosure url="${a.image.src}" type="image/jpeg" />` : ""}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${cdata(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${cdata(SITE_TAGLINE)}</description>
    <language>pa-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed/" rel="self" type="application/rss+xml" />
${entries}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
