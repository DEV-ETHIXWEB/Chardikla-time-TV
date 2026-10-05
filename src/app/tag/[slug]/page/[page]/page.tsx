import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArchiveView from "@/components/ArchiveView";
import { loadTermArchive } from "@/lib/archive";
import { metadataFromTerm } from "@/lib/seo";
import { getTermBySlug } from "@/lib/wp";
import { isNotFound } from "@/lib/notfound";
import OriginDown from "@/components/OriginDown";

export const revalidate = 300;
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string; page: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, page } = await params;
  const term = await getTermBySlug("tags", slug).catch(() => null);
  return term
    ? metadataFromTerm(term, Number(page) || 1)
    : { title: "ਟੈਗ ਨਹੀਂ ਮਿਲਿਆ" };
}

export default async function TagPagedPage({ params }: Props) {
  const { slug, page: pageParam } = await params;
  const page = Number(pageParam);
  if (!Number.isInteger(page) || page < 2) notFound();

  let data;
  try {
    data = await loadTermArchive("tags", slug, page);
  } catch (err) {
    if (isNotFound(err)) throw err;
    return <OriginDown what="ਇਹ ਟੈਗ" />;
  }
  const { term, items, total, totalPages } = data;
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
