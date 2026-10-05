import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import BreakingTicker from "@/components/BreakingTicker";
import SectionHeading from "@/components/SectionHeading";
import TopStories from "@/components/TopStories";
import { getCategories, getCategoryRails, getPosts, TTL } from "@/lib/wp";

export const revalidate = 60;

export default async function HomePage() {
  // An origin outage must not fail the build or the request — the empty state
  // below renders instead, and `revalidate` restores the real page as soon as
  // WordPress answers again.
  const [latestResult, categories] = await Promise.all([
    getPosts({ perPage: 26 }, { revalidate: TTL.home }).catch(() => null),
    getCategories().catch(() => []),
  ]);
  const latest = latestResult?.items ?? [];

  if (latest.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-xl font-bold">ਖ਼ਬਰਾਂ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੀਆਂ</h1>
        <p className="mt-2 text-ink-soft">ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਦੇਰ ਬਾਅਦ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।</p>
      </div>
    );
  }

  const [lead, ...rest] = latest;
  const secondary = rest.slice(0, 3);
  const topStories = rest.slice(3, 9);
  const grid = rest.slice(9, 19);

  const railTerms = categories.slice(0, 5);
  const rails = await getCategoryRails(railTerms, 5);

  return (
    <>
      <BreakingTicker items={latest.slice(0, 8)} />

      <div className="mx-auto max-w-7xl px-4 py-7">
        <h1 className="sr-only">
          Chardikla Time TV — ਪੰਜਾਬੀ ਖ਼ਬਰਾਂ, ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ ਅਤੇ ਲਾਈਵ ਨਿਊਜ਼
        </h1>

        {/* Lead story, three supporting items, then a numbered column. The
            photo column is kept narrow on purpose — see TopStories. */}
        <section aria-label="ਮੁੱਖ ਖ਼ਬਰਾਂ" className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ArticleCard article={lead} variant="hero" priority showExcerpt />
          </div>

          <div className="grid gap-5 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1 lg:gap-4">
            {secondary.map((a) => (
              <ArticleCard key={a.id} article={a} variant="compact" />
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <section aria-label="ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ" className="lg:col-span-8">
            <SectionHeading title="ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ" href="/latest/" />
            <div className="grid gap-x-5 gap-y-8 grid-cols-2 lg:grid-cols-3">
              {grid.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>

          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <TopStories items={topStories} />
            </div>
          </div>
        </div>

        {rails.map(({ term, items }) => (
          <section key={term.id} aria-label={term.name} className="mt-12">
            <SectionHeading title={term.name} href={term.path} />
            <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((a) => (
                <ArticleCard key={a.id} article={a} variant="rail" />
              ))}
            </div>
          </section>
        ))}

        <div className="mt-14 text-center">
          <Link
            href="/latest/"
            className="inline-block rounded-lg bg-brand px-7 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md"
          >
            ਸਾਰੀਆਂ ਖ਼ਬਰਾਂ ਵੇਖੋ
          </Link>
        </div>
      </div>
    </>
  );
}
