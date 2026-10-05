import Link from "next/link";
import type { Article } from "@/lib/types";
import { smartStamp } from "@/lib/format";

/**
 * A numbered, image-free list.
 *
 * Deliberate: the featured images on this site are 500px originals, so a column
 * of large photos reads as soft. Type carries this block instead, which looks
 * sharper on every device and gives the page an editorial spine.
 */
export default function TopStories({
  items,
  title = "ਵੱਡੀਆਂ ਖ਼ਬਰਾਂ",
}: {
  items: Article[];
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section aria-label={title} className="rounded-xl border border-line bg-surface-soft/60 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
        <span className="inline-block h-4 w-1.5 bg-accent" />
        {title}
      </h2>
      <ol className="divide-y divide-line">
        {items.map((a, i) => (
          <li key={a.id} className="group py-3 first:pt-0 last:pb-0">
            <Link href={a.path} className="flex gap-3.5">
              <span
                aria-hidden="true"
                className="mt-0.5 w-6 shrink-0 text-xl font-bold leading-none tabular-nums text-brand-ink/35 transition-colors group-hover:text-accent-ink"
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="clamp-3 block text-[0.9375rem] font-semibold leading-snug text-ink transition-colors group-hover:text-brand-ink">
                  {a.title}
                </span>
                <time
                  dateTime={a.date}
                  className="mt-1 block text-xs tabular-nums text-ink-faint"
                >
                  {smartStamp(a.date)}
                </time>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
