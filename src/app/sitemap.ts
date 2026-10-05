import type { MetadataRoute } from "next";
import { getCategories, getSitemapPage } from "@/lib/wp";
import { SITE_URL } from "@/lib/seo";

/** Google caps a sitemap at 50,000 URLs; we chunk well below that. */
const CHUNK = 1000;

export async function generateSitemaps() {
  try {
    const { total } = await getSitemapPage(1, 1);
    const count = Math.max(1, Math.ceil(total / CHUNK));
    return Array.from({ length: count }, (_, id) => ({ id }));
  } catch {
    return [{ id: 0 }];
  }
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // The first chunk also carries the landing pages and every category.
  if (id === 0) {
    entries.push(
      { url: SITE_URL, changeFrequency: "hourly", priority: 1 },
      { url: `${SITE_URL}/latest`, changeFrequency: "hourly", priority: 0.8 },
    );
    try {
      for (const c of await getCategories()) {
        entries.push({
          url: `${SITE_URL}${c.path}`,
          changeFrequency: "hourly",
          priority: 0.7,
        });
      }
    } catch {
      /* categories are best-effort */
    }
  }

  // WordPress pages are 1-indexed and we request 100 at a time.
  const perPage = 100;
  const pagesPerChunk = CHUNK / perPage;
  const startPage = id * pagesPerChunk + 1;

  const batches = await Promise.all(
    Array.from({ length: pagesPerChunk }, (_, i) =>
      getSitemapPage(startPage + i, perPage)
        .then((r) => r.items)
        .catch(() => []),
    ),
  );

  for (const article of batches.flat()) {
    entries.push({
      url: `${SITE_URL}${article.path}`,
      lastModified: article.modified,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return entries;
}
