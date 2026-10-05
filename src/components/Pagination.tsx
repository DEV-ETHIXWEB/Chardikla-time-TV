import Link from "next/link";

/**
 * Numbered pagination rather than infinite scroll. Archive pages need to be
 * crawlable, and an infinite list hides twenty thousand posts from Google.
 */
export default function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  // Query-string bases (search, archive) page via ?page=; path bases use /page/N.
  const href = (n: number) => {
    if (basePath.includes("?")) {
      const [path, qs] = basePath.split("?");
      const params = new URLSearchParams(qs);
      if (n === 1) params.delete("page");
      else params.set("page", String(n));
      const q = params.toString();
      return q ? `${path}?${q}` : path;
    }
    return n === 1 ? basePath : `${basePath.replace(/\/$/, "")}/page/${n}`;
  };

  const window = 2;
  const pages: Array<number | "gap"> = [];
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - page) <= window) {
      pages.push(n);
    } else if (pages[pages.length - 1] !== "gap") {
      pages.push("gap");
    }
  }

  const cell =
    "inline-flex min-w-10 items-center justify-center rounded-md border border-line px-3 py-2 text-sm font-medium";

  return (
    <nav aria-label="ਸਫ਼ੇ" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={href(page - 1)} className={`${cell} hover:border-brand-ink hover:text-brand-ink`} rel="prev">
          ← ਪਿੱਛੇ
        </Link>
      )}
      {pages.map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-2 text-ink-faint">
            …
          </span>
        ) : p === page ? (
          <span key={p} aria-current="page" className={`${cell} border-brand-ink bg-brand text-white`}>
            {p}
          </span>
        ) : (
          <Link key={p} href={href(p)} className={`${cell} hover:border-brand-ink hover:text-brand-ink`}>
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link href={href(page + 1)} className={`${cell} hover:border-brand-ink hover:text-brand-ink`} rel="next">
          ਅੱਗੇ →
        </Link>
      )}
    </nav>
  );
}
