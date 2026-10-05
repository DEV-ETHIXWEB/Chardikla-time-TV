import type { Metadata } from "next";
import ArchiveView from "@/components/ArchiveView";
import { getPosts, TTL } from "@/lib/wp";
import { PER_PAGE } from "@/lib/archive";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ",
  description: "ਪੰਜਾਬ, ਦੇਸ਼ ਅਤੇ ਦੁਨੀਆ ਦੀਆਂ ਸਾਰੀਆਂ ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ।",
  alternates: { canonical: `${SITE_URL}/latest/` },
};

export default async function LatestPage() {
  const result = await getPosts(
    { perPage: PER_PAGE, page: 1 },
    { revalidate: TTL.home },
  ).catch(() => null);
  const { items, total, totalPages } = result ?? {
    items: [],
    total: 0,
    totalPages: 0,
  };
  return (
    <ArchiveView
      title="ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ"
      items={items}
      page={1}
      totalPages={totalPages}
      total={total}
      basePath="/latest"
    />
  );
}
