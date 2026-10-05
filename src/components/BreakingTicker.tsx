import Link from "next/link";
import type { Article } from "@/lib/types";

/**
 * CSS-only marquee. A JS ticker on a news homepage is a main-thread cost the
 * audience's devices do not need to pay.
 */
export default function BreakingTicker({ items }: { items: Article[] }) {
  if (items.length === 0) return null;
  const run = [...items, ...items]; // duplicated so the loop has no visible seam

  return (
    <div className="flex items-stretch border-b border-line bg-surface-soft">
      <div className="flex shrink-0 items-center gap-2 bg-live px-3 py-2 text-xs font-bold uppercase tracking-wide text-white sm:px-4">
        <span className="inline-block size-2 animate-pulse rounded-full bg-white" />
        ਤਾਜ਼ਾ
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="ticker-track py-2">
          {run.map((a, i) => (
            <Link
              key={`${a.id}-${i}`}
              href={a.path}
              className="inline-flex min-h-6 items-center whitespace-nowrap px-5 text-sm text-ink hover:text-brand-ink"
            >
              <span aria-hidden="true" className="me-2 text-accent-ink">•</span>
              {a.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
