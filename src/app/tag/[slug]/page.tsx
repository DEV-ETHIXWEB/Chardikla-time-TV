import type { Metadata } from "next";
import ArchiveView from "@/components/ArchiveView";
import { loadTermArchive } from "@/lib/archive";
import { isNotFound } from "@/lib/notfound";
import OriginDown from "@/components/OriginDown";
import { metadataFromTerm } from "@/lib/seo";
import { getTermBySlug } from "@/lib/wp";

export const revalidate = 300;
/**
 * There are nearly 25,000 tags. None are pre-rendered; they generate on first
 * request and cache from there.
 */
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const term = await getTermBySlug("tags", slug).catch(() => null);
  return term ? metadataFromTerm(term) : { title: "ਟੈਗ ਨਹੀਂ ਮਿਲਿਆ" };
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  let data;
  try {
    data = await loadTermArchive("tags", slug, 1);
  } catch (err) {
    // Any origin failure, not just OriginUnavailableError: a connect timeout
    // during prerender used to abort the entire build, which wiped the
    // previous good output and left nothing servable. `revalidate` on this
    // route re-renders the real page as soon as WordPress is reachable.
    if (isNotFound(err)) throw err;
    return <OriginDown what="ਇਹ ਟੈਗ" />;
  }
  const { term, items, total, totalPages, page } = data;
  return (
    <ArchiveView
      title={`#${term.name}`}
      items={items}
      page={page}
      totalPages={totalPages}
      total={total}
      basePath={term.path}
    />
  );
}
