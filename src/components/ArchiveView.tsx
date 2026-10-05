import ArticleCard from "@/components/ArticleCard";
import Pagination from "@/components/Pagination";
import type { Article } from "@/lib/types";

export default function ArchiveView({
  title,
  subtitle,
  items,
  page,
  totalPages,
  total,
  basePath,
}: {
  title: string;
  subtitle?: string;
  items: Article[];
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 border-b-2 border-brand-ink pb-4">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">
          <span className="me-2.5 inline-block h-6 w-2 translate-y-0.5 bg-accent" />
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>}
        {total > 0 && (
          <p className="mt-1 text-xs text-ink-faint">
            {total.toLocaleString("en-IN")} ਖ਼ਬਰਾਂ
            {totalPages > 1 && ` · ਸਫ਼ਾ ${page} / ${totalPages}`}
          </p>
        )}
      </header>

      {items.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">
          ਇਸ ਸ਼੍ਰੇਣੀ ਵਿੱਚ ਕੋਈ ਖ਼ਬਰ ਨਹੀਂ ਮਿਲੀ।
        </p>
      ) : (
        <>
          {/* Cards render their headlines as h3. Without this the page jumps
              h1 -> h3, which axe flags as heading-order and screen-reader
              users hear as a missing level. */}
          <h2 className="sr-only">ਖ਼ਬਰਾਂ</h2>
          <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((a, i) => (
            <ArticleCard
              key={a.id}
              article={a}
              priority={i < 4}
              showExcerpt
            />
            ))}
          </div>
        </>
      )}

      <Pagination basePath={basePath} page={page} totalPages={totalPages} />
    </div>
  );
}
