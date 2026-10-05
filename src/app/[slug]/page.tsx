import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, unstable_rethrow } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import SectionHeading from "@/components/SectionHeading";
import ShareBar from "@/components/ShareBar";
import {
  getPostBySlug,
  getPosts,
  getRecentSlugs,
  TTL,
} from "@/lib/wp";
import OriginDown from "@/components/OriginDown";
import { prepareContent } from "@/lib/content";
import { formatDate, formatTime, readingTime } from "@/lib/format";
import { BLUR_DATA_URL, IMG_QUALITY, SIZES } from "@/lib/image";
import {
  SITE_URL,
  articleJsonLd,
  breadcrumbJsonLd,
  metadataFromArticle,
} from "@/lib/seo";

export const revalidate = 300;
/** Twenty thousand posts must not be built up front; they fill in on demand. */
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Only the most recent posts are pre-rendered. Everything older is generated
 * on first request and then cached, which keeps the build to minutes instead
 * of hours while still serving static HTML.
 */
export async function generateStaticParams() {
  try {
    return (await getRecentSlugs(50)).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPostBySlug(slug).catch(() => null);
  if (!article) return { title: "ਖ਼ਬਰ ਨਹੀਂ ਮਿਲੀ" };
  return metadataFromArticle(article);
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  let article: Awaited<ReturnType<typeof getPostBySlug>>;
  try {
    article = await getPostBySlug(slug);
  } catch (err) {
    // See the category route: an origin outage must not fail the build.
    unstable_rethrow(err);
    return <OriginDown what="ਇਹ ਖ਼ਬਰ" />;
  }
  if (!article) notFound();

  const primary = article.categories[0];
  const html = prepareContent(article.content);
  const mins = readingTime(article.content);

  // Related: same category, this post excluded. Falls back to silence rather
  // than failing the page.
  const related = primary
    ? await getPosts(
        { categories: primary.id, perPage: 4, exclude: [article.id] },
        { revalidate: TTL.list },
      )
        .then((r) => r.items)
        .catch(() => [])
    : [];

  const trail = [
    { name: "ਮੁੱਖ ਪੰਨਾ", path: "/" },
    ...(primary ? [{ name: primary.name, path: primary.path }] : []),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd(article)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([...trail, { name: article.title, path: article.path }]),
          ),
        }}
      />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
        <nav aria-label="ਬਰੈੱਡਕਰੰਬ" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
          {trail.map((t, i) => (
            <span key={t.path} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              <Link href={t.path} className="hover:text-brand-ink">
                {t.name}
              </Link>
            </span>
          ))}
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article>
            <header>
              {primary && (
                <Link
                  href={primary.path}
                  className="inline-block rounded-sm bg-accent-chip px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                >
                  {primary.name}
                </Link>
              )}
              <h1 className="mt-3 text-2xl font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
                {article.title}
              </h1>

              {article.excerpt && (
                <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                  {article.excerpt}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line py-3 text-sm text-ink-faint">
                {article.author && (
                  <span className="font-medium text-ink-soft">
                    {article.author.name}
                  </span>
                )}
                <time dateTime={article.date}>
                  {formatDate(article.date)}
                  {formatTime(article.date) && `, ${formatTime(article.date)}`}
                </time>
                <span>{mins} ਮਿੰਟ ਪੜ੍ਹਨ ਲਈ</span>
              </div>
            </header>

            {article.image && (
              <figure className="mt-6">
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-surface-soft ring-1 ring-line">
                  <Image
                    src={article.image.src}
                    alt={article.image.alt || article.title}
                    fill
                    priority
                    quality={IMG_QUALITY}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes={SIZES.article}
                    className="object-cover"
                  />
                </div>
              </figure>
            )}

            <ShareBar
              url={`${SITE_URL}${article.path}`}
              title={article.title}
            />

            <div
              className="article-body mt-6"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {article.tags.length > 0 && (
              <div className="mt-10 border-t border-line pt-6">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">
                  ਟੈਗ
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {article.tags.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={t.path}
                        className="inline-block rounded-full border border-line px-3 py-1 text-sm text-ink-soft transition-colors hover:border-brand-ink hover:text-brand-ink"
                      >
                        #{t.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            {related.length > 0 && (
              <>
                <SectionHeading title="ਸੰਬੰਧਿਤ ਖ਼ਬਰਾਂ" href={primary?.path} />
                <div className="grid gap-5">
                  {related.map((a) => (
                    <ArticleCard key={a.id} article={a} variant="compact" />
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
