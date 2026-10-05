import type { Metadata } from "next";
import Link from "next/link";
import ArchiveFilters from "@/components/ArchiveFilters";
import ArticleCard from "@/components/ArticleCard";
import Pagination from "@/components/Pagination";
import { getCategories, getPosts } from "@/lib/wp";
import { formatDate } from "@/lib/format";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "ਪੁਰਾਣੀਆਂ ਖ਼ਬਰਾਂ",
  description:
    "ਤਾਰੀਖ਼ ਅਨੁਸਾਰ ਪੁਰਾਣੀਆਂ ਖ਼ਬਰਾਂ ਲੱਭੋ ਅਤੇ ਡਾਊਨਲੋਡ ਕਰੋ।",
  alternates: { canonical: `${SITE_URL}/archive/` },
  // Archive permutations are near-duplicate listings; keep them out of the index
  // but let crawlers follow through to the articles themselves.
  robots: { index: false, follow: true },
};

const PER_PAGE = 20;

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

interface Props {
  searchParams: Promise<{
    from?: string;
    to?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function ArchivePage({ searchParams }: Props) {
  const sp = await searchParams;

  const valid = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
  const from = valid(sp.from) ?? isoDaysAgo(60);
  const to = valid(sp.to) ?? new Date().toISOString().slice(0, 10);
  const category = sp.category ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const categories = await getCategories().catch(() => []);

  const result =
    from <= to
      ? await getPosts({
          after: `${from}T00:00:00`,
          before: `${to}T23:59:59`,
          categories: category || undefined,
          perPage: PER_PAGE,
          page,
        }).catch(() => null)
      : null;

  const base = new URLSearchParams({ from, to });
  if (category) base.set("category", category);
  const basePath = `/archive/?${base.toString()}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          <span className="inline-block h-6 w-2 rounded-full bg-accent" />
          ਪੁਰਾਣੀਆਂ ਖ਼ਬਰਾਂ
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          ਤਾਰੀਖ਼ ਚੁਣੋ ਅਤੇ ਉਸ ਸਮੇਂ ਦੀਆਂ ਸਾਰੀਆਂ ਖ਼ਬਰਾਂ ਵੇਖੋ। ਤੁਸੀਂ ਇਹਨਾਂ ਨੂੰ Excel (CSV)
          ਜਾਂ JSON ਫਾਈਲ ਵਿੱਚ ਡਾਊਨਲੋਡ ਵੀ ਕਰ ਸਕਦੇ ਹੋ।
        </p>
      </header>

      <ArchiveFilters
        categories={categories}
        from={from}
        to={to}
        category={category}
      />

      <div className="mt-8">
        {!result ? (
          <p className="py-16 text-center text-ink-soft">
            ਖ਼ਬਰਾਂ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੀਆਂ। ਕਿਰਪਾ ਕਰਕੇ ਤਾਰੀਖ਼ ਜਾਂਚੋ ਅਤੇ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।
          </p>
        ) : result.items.length === 0 ? (
          <p className="py-16 text-center text-ink-soft">
            {formatDate(from)} ਤੋਂ {formatDate(to)} ਤੱਕ ਕੋਈ ਖ਼ਬਰ ਨਹੀਂ ਮਿਲੀ।
          </p>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
              <h2 className="text-base font-bold text-ink">
                {formatDate(from)} – {formatDate(to)}
              </h2>
              <p className="text-sm text-ink-faint">
                ਕੁੱਲ {result.total.toLocaleString("en-IN")} ਖ਼ਬਰਾਂ
                {result.totalPages > 1 &&
                  ` · ਸਫ਼ਾ ${page} / ${result.totalPages}`}
              </p>
            </div>

            <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {result.items.map((a) => (
                <ArticleCard key={a.id} article={a} showExcerpt />
              ))}
            </div>

            <Pagination
              basePath={basePath}
              page={page}
              totalPages={result.totalPages}
            />
          </>
        )}
      </div>

      <p className="mt-10 text-center text-xs text-ink-faint">
        ਕਿਸੇ ਵੀ ਖ਼ਬਰ ਦਾ ਪੂਰਾ ਪੁਰਾਲੇਖ{" "}
        <Link href="/latest/" className="text-brand-ink underline underline-offset-2">
          ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ
        </Link>{" "}
        ਵਿੱਚ ਵੀ ਉਪਲਬਧ ਹੈ।
      </p>
    </div>
  );
}
