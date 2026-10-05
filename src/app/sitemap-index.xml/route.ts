import { getSitemapPage } from "@/lib/wp";
import { SITE_URL } from "@/lib/seo";

/**
 * Sitemap index.
 *
 * `generateSitemaps` in app/sitemap.ts emits /sitemap/0.xml, /sitemap/1.xml …
 * but Next does not produce the index that ties them together, and it reserves
 * /sitemap.xml for its own metadata route — so that URL 404s. robots.txt used
 * to point there, which meant Google fetched nothing and discovered none of
 * the 21 chunks. This is the index robots.txt now advertises.
 */
export const revalidate = 3600;

/** Must match CHUNK in app/sitemap.ts. */
const CHUNK = 1000;

export async function GET() {
  let count = 1;
  try {
    const { total } = await getSitemapPage(1, 1);
    count = Math.max(1, Math.ceil(total / CHUNK));
  } catch {
    count = 1;
  }

  const now = new Date().toISOString();
  const chunks = Array.from(
    { length: count },
    (_, i) =>
      `  <sitemap>\n    <loc>${SITE_URL}/sitemap/${i}.xml</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`,
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunks}
  <sitemap>
    <loc>${SITE_URL}/news-sitemap.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
