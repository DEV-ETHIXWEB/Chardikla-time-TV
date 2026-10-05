import Link from "next/link";

/**
 * Shown when WordPress cannot be reached and the page was never cached.
 *
 * Deliberately not a 404: telling Google a story is "not found" because the
 * CMS had a bad minute is how articles fall out of the index. This renders a
 * real explanation and a way onward, and the route sets a 503 so crawlers
 * understand it is temporary.
 */
export default function OriginDown({ what = "ਇਹ ਪੰਨਾ" }: { what?: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-ink">ਖ਼ਬਰਾਂ ਹਾਲੇ ਲੋਡ ਨਹੀਂ ਹੋ ਸਕੀਆਂ</h1>
      <p className="mt-3 leading-relaxed text-ink-soft">
        {what} ਇਸ ਵੇਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਇਹ ਕੁਝ ਪਲਾਂ ਦੀ ਸਮੱਸਿਆ ਹੈ — ਕਿਰਪਾ ਕਰਕੇ ਥੋੜ੍ਹੀ
        ਦੇਰ ਬਾਅਦ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          ਮੁੱਖ ਪੰਨਾ
        </Link>
        <Link
          href="/latest/"
          className="rounded-md border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand-ink hover:text-brand-ink"
        >
          ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ
        </Link>
      </div>
      <p className="mt-6 text-xs text-ink-faint">
        ਪਹਿਲਾਂ ਵੇਖੀਆਂ ਖ਼ਬਰਾਂ ਹਾਲੇ ਵੀ ਖੁੱਲ੍ਹ ਸਕਦੀਆਂ ਹਨ।
      </p>
    </div>
  );
}
