import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/types";
import { smartStamp } from "@/lib/format";
import { BLUR_DATA_URL, IMG_QUALITY, SIZES } from "@/lib/image";

type Variant = "hero" | "standard" | "compact" | "rail";

/**
 * Card images are decorative: each one sits inside the same link as the
 * headline, so a descriptive alt makes screen readers announce the story
 * twice. axe flags this as image-redundant-alt. The headline carries meaning.
 */
interface Props {
  article: Article;
  variant?: Variant;
  priority?: boolean;
  showExcerpt?: boolean;
}

function CategoryChip({ article }: { article: Article }) {
  const cat = article.categories[0];
  if (!cat) return null;
  return (
    <span className="inline-block rounded bg-accent-chip px-2 py-0.5 text-[11px] font-semibold uppercase leading-relaxed tracking-wide text-white shadow-sm">
      {cat.name}
    </span>
  );
}

function Stamp({ iso, muted = false }: { iso: string; muted?: boolean }) {
  return (
    <time
      dateTime={iso}
      className={`text-xs tabular-nums ${muted ? "text-white/90" : "text-ink-faint"}`}
    >
      {smartStamp(iso)}
    </time>
  );
}

export default function ArticleCard({
  article,
  variant = "standard",
  priority = false,
  showExcerpt = false,
}: Props) {
  const img = article.image;

  if (variant === "hero") {
    return (
      <article className="group relative overflow-hidden rounded-xl bg-brand-900 ring-1 ring-black/5">
        <Link href={article.path} className="block">
          <div className="relative aspect-[4/3] w-full xs:aspect-[16/11] sm:aspect-[16/9]">
            {img ? (
              <Image
                src={img.src}
                alt=""
                fill
                priority={priority}
                quality={IMG_QUALITY}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes={SIZES.hero}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <div className="size-full bg-brand-800" />
            )}
            {/* A deeper gradient than usual: it carries the headline and also
                masks the softness of a 500px source blown up to hero size. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />
          </div>
          <div className="on-photo absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <CategoryChip article={article} />
              <Stamp iso={article.date} muted />
            </div>
            <h2 className="clamp-3 text-xl font-bold leading-tight tracking-tight text-white drop-shadow-sm sm:text-2xl lg:text-[2rem] lg:leading-[1.2]">
              {article.title}
            </h2>
            {showExcerpt && article.excerpt && (
              <p className="clamp-2 mt-2.5 hidden max-w-2xl text-sm leading-relaxed text-white/90 sm:block">
                {article.excerpt}
              </p>
            )}
          </div>
        </Link>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group flex gap-3.5">
        {/* Duplicate of the headline link below: same destination, image
            only. Hidden from assistive tech and the tab order so screen
            reader users hear each story once and keyboard users tab once. */}
        <Link
          href={article.path}
          className="shrink-0"
          aria-hidden="true"
          tabIndex={-1}
        >
          <div className="relative size-[88px] overflow-hidden rounded-lg bg-surface-soft ring-1 ring-line">
            {img && (
              <Image
                src={img.src}
                alt=""
                fill
                quality={IMG_QUALITY}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes={SIZES.thumb}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={article.path} className="block py-0.5">
            <h3 className="clamp-3 text-[0.9375rem] font-semibold leading-snug text-ink decoration-brand-ink/40 underline-offset-2 transition-colors group-hover:text-brand-ink group-hover:underline">
              {article.title}
            </h3>
          </Link>
          <div className="mt-1.5">
            <Stamp iso={article.date} />
          </div>
        </div>
      </article>
    );
  }

  if (variant === "rail") {
    return (
      <article className="group">
        <Link href={article.path} className="block">
          <div className="relative mb-2.5 aspect-[16/10] overflow-hidden rounded-lg bg-surface-soft ring-1 ring-line">
            {img && (
              <Image
                src={img.src}
                alt=""
                fill
                quality={IMG_QUALITY}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes={SIZES.rail}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
          </div>
          <h3 className="clamp-3 text-sm font-semibold leading-snug text-ink transition-colors group-hover:text-brand-ink">
            {article.title}
          </h3>
        </Link>
        <div className="mt-1.5">
          <Stamp iso={article.date} />
        </div>
      </article>
    );
  }

  return (
    <article className="group">
      <Link href={article.path} className="block">
        <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-lg bg-surface-soft ring-1 ring-line">
          {img ? (
            <Image
              src={img.src}
              alt=""
              fill
              priority={priority}
              quality={IMG_QUALITY}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              sizes={SIZES.card}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="size-full bg-surface-soft" />
          )}
          <div className="absolute start-2 top-2">
            <CategoryChip article={article} />
          </div>
        </div>
        <h3 className="clamp-3 text-[0.9375rem] font-bold leading-snug text-ink transition-colors group-hover:text-brand-ink sm:text-base">
          {article.title}
        </h3>
      </Link>
      {showExcerpt && article.excerpt && (
        <p className="clamp-2 mt-1.5 text-sm leading-relaxed text-ink-soft">
          {article.excerpt}
        </p>
      )}
      <div className="mt-2">
        <Stamp iso={article.date} />
      </div>
    </article>
  );
}
