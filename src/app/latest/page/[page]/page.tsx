import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArchiveView from "@/components/ArchiveView";
import { getPosts, TTL } from "@/lib/wp";
import { PER_PAGE } from "@/lib/archive";
import { SITE_URL } from "@/lib/seo";
import OriginDown from "@/components/OriginDown";

export const revalidate = 120;
export const dynamicParams = true;

interface Props {
  params: Promise<{ page: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ - ਸਫ਼ਾ ${page}`,
    alternates: { canonical: `${SITE_URL}/latest/page/${page}/` },
  };
}

export default async function LatestPagedPage({ params }: Props) {
  const { page: pageParam } = await params;
  const page = Number(pageParam);
  if (!Number.isInteger(page) || page < 2) notFound();

  const result = await getPosts(
    { perPage: PER_PAGE, page },
    { revalidate: TTL.list },
  ).catch(() => null);
  // A missing page is a 404; an outage renders the fallback rather than
  // telling a crawler the page is gone.
  if (!result) return <OriginDown what="ਇਹ ਸਫ਼ਾ" />;
  const { items, total, totalPages } = result;
  if (items.length === 0) notFound();

  return (
    <ArchiveView
      title="ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ"
      items={items}
      page={page}
      totalPages={totalPages}
      total={total}
      basePath="/latest"
    />
  );
}
