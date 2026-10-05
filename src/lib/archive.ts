import { notFound } from "next/navigation";
import { OriginUnavailableError, getPosts, getTermBySlug, TTL } from "./wp";
import type { Term } from "./types";

export const PER_PAGE = 16;

export { OriginUnavailableError };

export async function loadTermArchive(
  taxonomy: "categories" | "tags",
  slug: string,
  page: number,
) {
  // Only a genuinely missing term is a 404; a dead origin propagates so the
  // page can render a 503 instead of telling Google the section is gone.
  const term: Term | null = await getTermBySlug(taxonomy, slug);
  if (!term) notFound();

  const key = taxonomy === "categories" ? "categories" : "tags";
  const { items, total, totalPages } = await getPosts(
    { [key]: term.id, perPage: PER_PAGE, page },
    { revalidate: TTL.list },
  );

  if (page > 1 && items.length === 0) notFound();

  return { term, items, total, totalPages, page };
}
