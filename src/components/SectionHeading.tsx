import Link from "next/link";

export default function SectionHeading({
  title,
  href,
  moreLabel = "ਹੋਰ ਵੇਖੋ",
}: {
  title: string;
  href?: string;
  moreLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="relative flex items-center gap-2.5 text-lg font-bold tracking-tight text-ink sm:text-xl">
        <span className="inline-block h-5 w-1.5 rounded-full bg-accent" />
        {title}
      </h2>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        {href && (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center py-1.5 text-xs font-semibold text-brand-ink transition-colors hover:text-accent-ink"
          >
            {moreLabel} →
          </Link>
        )}
      </div>
    </div>
  );
}
