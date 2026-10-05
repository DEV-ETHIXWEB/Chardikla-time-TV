import type { Metadata } from "next";
import ArticleCard from "@/components/ArticleCard";
import Pagination from "@/components/Pagination";
import SearchForm from "@/components/SearchForm";
import { getPosts } from "@/lib/wp";

export const metadata: Metadata = {
  title: "ਖੋਜ",
  // Search result pages are thin and near-duplicate; keep them out of the index.
  robots: { index: false, follow: true },
};

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const query = q.trim();

  const result = query
    ? await getPosts({ search: query, perPage: 16, page }).catch(() => null)
    : null;

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      <header className="mb-8 border-b-2 border-brand-ink pb-4">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          <span className="me-2.5 inline-block h-6 w-2 translate-y-0.5 bg-accent" />
          ਖੋਜ
        </h1>
        <div className="mt-4 max-w-xl">
          <SearchForm defaultValue={query} />
        </div>
        {query && result && (
          <p className="mt-3 text-sm text-ink-faint">
            “{query}” ਲਈ {result.total.toLocaleString("en-IN")} ਨਤੀਜੇ
          </p>
        )}
      </header>

      {!query && (
        <p className="py-12 text-center text-ink-soft">
          ਖ਼ਬਰ ਲੱਭਣ ਲਈ ਉੱਪਰ ਕੁਝ ਲਿਖੋ।
        </p>
      )}

      {query && result && result.items.length === 0 && (
        <p className="py-12 text-center text-ink-soft">
          “{query}” ਲਈ ਕੋਈ ਨਤੀਜਾ ਨਹੀਂ ਮਿਲਿਆ।
        </p>
      )}

      {result && result.items.length > 0 && (
        <>
          {/* Keeps the heading order h1 -> h2 -> h3 (card headlines). */}
          <h2 className="sr-only">ਖੋਜ ਨਤੀਜੇ</h2>
          <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
            {result.items.map((a) => (
              <ArticleCard key={a.id} article={a} showExcerpt />
            ))}
          </div>
          <Pagination
            basePath={`/search?q=${encodeURIComponent(query)}`}
            page={page}
            totalPages={result.totalPages}
          />
        </>
      )}
    </div>
  );
}
