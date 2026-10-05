import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import ArchiveView from "@/components/ArchiveView";
import { loadTermArchive } from "@/lib/archive";
import OriginDown from "@/components/OriginDown";
import { metadataFromTerm } from "@/lib/seo";
import { getCategories, getTermBySlug } from "@/lib/wp";

export const revalidate = 120;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    return (await getCategories()).map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const term = await getTermBySlug("categories", slug).catch(() => null);
  return term ? metadataFromTerm(term) : { title: "ਸ਼੍ਰੇਣੀ ਨਹੀਂ ਮਿਲੀ" };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  let data;
  try {
    data = await loadTermArchive("categories", slug, 1);
  } catch (err) {
    // Any origin failure, not just OriginUnavailableError: a connect timeout
    // during prerender used to abort the entire build, which wiped the
    // previous good output and left nothing servable. `revalidate` on this
    // route re-renders the real page as soon as WordPress is reachable.
    unstable_rethrow(err);
    return <OriginDown what="ਇਹ ਸ਼੍ਰੇਣੀ" />;
  }
  const { term, items, total, totalPages, page } = data;
  return (
    <ArchiveView
      title={term.name}
      items={items}
      page={page}
      totalPages={totalPages}
      total={total}
      basePath={term.path}
    />
  );
}
