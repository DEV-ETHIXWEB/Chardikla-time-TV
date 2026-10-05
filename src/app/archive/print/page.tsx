import type { Metadata } from "next";
import Image from "next/image";
import PrintTrigger from "@/components/PrintTrigger";
import { walkDateRange } from "@/lib/wp";
import { formatDate } from "@/lib/format";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import type { Article } from "@/lib/types";

export const metadata: Metadata = {
  title: "ਖ਼ਬਰਾਂ ਦਾ ਪੁਰਾਲੇਖ",
  robots: { index: false, follow: false },
};

/** A print run pulls far more than a screen does, so give it room. */
export const maxDuration = 300;

/** Keeps one document to a sane page count; the UI warns past this. */
const MAX_ARTICLES = 500;

interface Props {
  searchParams: Promise<{
    from?: string;
    to?: string;
    category?: string;
    auto?: string;
    full?: string;
  }>;
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default async function ArchivePrintPage({ searchParams }: Props) {
  const sp = await searchParams;
  const valid = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
  const from = valid(sp.from) ?? isoDaysAgo(60);
  const to = valid(sp.to) ?? new Date().toISOString().slice(0, 10);
  const withBody = sp.full === "1";

  const articles: Article[] = [];
  let truncated = false;
  try {
    for await (const batch of walkDateRange({
      after: `${from}T00:00:00`,
      before: `${to}T23:59:59`,
      categories: sp.category || undefined,
      maxPosts: MAX_ARTICLES + 1,
      withContent: withBody,
    })) {
      articles.push(...batch);
      if (articles.length > MAX_ARTICLES) {
        truncated = true;
        articles.length = MAX_ARTICLES;
        break;
      }
    }
  } catch {
    /* render whatever arrived rather than failing the whole document */
  }

  return (
    <div className="print-view mx-auto max-w-3xl px-5 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <p className="text-sm text-ink-soft">
          ਪ੍ਰਿੰਟ ਡਾਇਲਾਗ ਵਿੱਚ <strong>“Save as PDF”</strong> ਚੁਣੋ।
        </p>
        <PrintTrigger auto={sp.auto === "1"} />
      </div>

      <header className="mb-6 border-b-2 border-black pb-4">
        <Image
          src="/logo.png"
          alt={SITE_NAME}
          width={272}
          height={90}
          className="h-10 w-auto"
          unoptimized
        />
        <h1 className="mt-3 text-xl font-bold">ਖ਼ਬਰਾਂ ਦਾ ਪੁਰਾਲੇਖ</h1>
        <p className="mt-1 text-sm">
          {formatDate(from)} – {formatDate(to)} · ਕੁੱਲ {articles.length} ਖ਼ਬਰਾਂ
        </p>
        <p className="mt-0.5 text-xs text-ink-faint">{SITE_URL}</p>
      </header>

      {truncated && (
        <p className="mb-5 border-s-4 border-live ps-3 text-sm">
          ਇਸ ਦਸਤਾਵੇਜ਼ ਵਿੱਚ ਪਹਿਲੀਆਂ {MAX_ARTICLES} ਖ਼ਬਰਾਂ ਹੀ ਹਨ। ਪੂਰਾ ਡਾਟਾ ਲੈਣ ਲਈ ਛੋਟੇ
          ਸਮੇਂ ਚੁਣੋ।
        </p>
      )}

      {articles.length === 0 ? (
        <p className="py-10 text-center">ਇਸ ਸਮੇਂ ਵਿੱਚ ਕੋਈ ਖ਼ਬਰ ਨਹੀਂ ਮਿਲੀ।</p>
      ) : (
        <ol className="space-y-5">
          {articles.map((a, i) => (
            <li
              key={a.id}
              // Keep an entry from splitting across a page break.
              className="break-inside-avoid border-b border-line pb-4"
            >
              <div className="flex gap-3">
                <span className="w-8 shrink-0 text-sm tabular-nums text-ink-faint">
                  {i + 1}.
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold leading-snug">{a.title}</h2>
                  <p className="mt-1 text-xs text-ink-faint">
                    {formatDate(a.date)}
                    {a.categories[0] ? ` · ${a.categories[0].name}` : ""}
                  </p>
                  {withBody && a.content ? (
                    <div
                      className="print-body mt-2 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: a.content.replace(/<img[^>]*>/gi, ""),
                      }}
                    />
                  ) : (
                    a.excerpt && (
                      <p className="mt-1.5 text-sm leading-relaxed">{a.excerpt}</p>
                    )
                  )}
                  <p className="mt-1.5 break-all text-[10px] text-ink-faint">
                    {SITE_URL}
                    {a.path}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <footer className="mt-8 border-t border-line pt-4 text-xs text-ink-faint">
        © {new Date().getFullYear()} {SITE_NAME}
      </footer>
    </div>
  );
}
