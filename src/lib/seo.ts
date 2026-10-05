import type { Metadata } from "next";
import type { Article, Term, YoastHead } from "./types";
import { truncate } from "./format";

/**
 * The public origin, used for canonicals, OG tags, sitemaps and robots.txt.
 *
 * This must never silently fall back to localhost. It did on the first Vercel
 * deploy — `NEXT_PUBLIC_SITE_URL` was not set in the project settings, so every
 * canonical tag, OG url and sitemap entry on the live site pointed at
 * http://localhost:3000. Google would have taken that at face value.
 *
 * So the host's own deployment URL is used when the variable is absent:
 * `VERCEL_PROJECT_PRODUCTION_URL` is the stable production domain, `VERCEL_URL`
 * the per-deployment one. Setting NEXT_PUBLIC_SITE_URL explicitly still wins,
 * and is what you want once a custom domain is attached.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProd) return `https://${vercelProd.replace(/^https?:\/\//, "")}`;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "Chardikla Time TV";
export const SITE_TAGLINE = "ਪੰਜਾਬੀ ਖ਼ਬਰਾਂ | Latest Punjabi News";

/** Rewrite a WordPress-origin URL onto our own origin. */
/** Ensure a path carries the trailing slash WordPress and our config both use. */
export function withSlash(path: string): string {
  if (!path.startsWith("/")) return path;
  const [p, q = ""] = path.split("?");
  return p.endsWith("/") ? path : `${p}/${q ? `?${q}` : ""}`;
}

export function rehost(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    // Media stays on the WordPress origin; only page URLs move.
    if (u.pathname.startsWith("/wp-content/")) return url;
    return `${SITE_URL}${u.pathname}${u.search}`;
  } catch {
    return url;
  }
}

function robotsFromYoast(y?: YoastHead): Metadata["robots"] {
  const r = y?.robots;
  if (!r) return undefined;
  return {
    index: r.index !== "noindex",
    follow: r.follow !== "nofollow",
    "max-snippet": Number(r["max-snippet"]?.replace(/\D/g, "")) || undefined,
    "max-image-preview":
      (r["max-image-preview"]?.replace(
        "max-image-preview:",
        "",
      ) as "none" | "standard" | "large") || "large",
  };
}

/**
 * Yoast already carries the SEO this site earned over twenty thousand posts.
 * We reuse it rather than inventing our own titles and descriptions, which is
 * the single cheapest way to protect rankings through the migration.
 */
export function metadataFromArticle(article: Article): Metadata {
  const y = article.seo;
  const title = y?.title ?? `${article.title} - ${SITE_NAME}`;
  const description =
    y?.description ?? truncate(article.excerpt || article.title, 160);
  const canonical =
    rehost(y?.canonical) ?? `${SITE_URL}${withSlash(article.path)}`;
  const ogImage = y?.og_image?.[0]?.url ?? article.image?.src;

  return {
    // `absolute` stops the layout's "%s - Chardikla Time TV" template from
    // appending the brand a second time; Yoast titles already include it.
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: robotsFromYoast(y),
    openGraph: {
      type: "article",
      title: y?.og_title ?? title,
      description: y?.og_description ?? description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "pa_IN",
      publishedTime: article.date,
      modifiedTime: article.modified,
      images: ogImage
        ? [
            {
              url: ogImage,
              width: y?.og_image?.[0]?.width ?? article.image?.width ?? 1200,
              height: y?.og_image?.[0]?.height ?? article.image?.height ?? 675,
              alt: article.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: y?.og_title ?? title,
      description: y?.og_description ?? description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export function metadataFromTerm(term: Term, page = 1): Metadata {
  const label = term.taxonomy === "category" ? "ਸ਼੍ਰੇਣੀ" : "ਟੈਗ";
  const suffix = page > 1 ? ` - ਸਫ਼ਾ ${page}` : "";
  const canonical = `${SITE_URL}${withSlash(term.path)}${
    page > 1 ? `page/${page}/` : ""
  }`;
  return {
    title: { absolute: `${term.name}${suffix} - ${SITE_NAME}` },
    description: `${term.name} ${label} ਦੀਆਂ ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ। ${SITE_TAGLINE}`,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: `${term.name} - ${SITE_NAME}`,
      url: canonical,
      siteName: SITE_NAME,
      locale: "pa_IN",
    },
  };
}

/**
 * NewsArticle schema. Yoast ships its own graph, but it points at WordPress
 * URLs, so we emit a clean graph against our own origin instead.
 */
export function articleJsonLd(article: Article) {
  const url = `${SITE_URL}${article.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: truncate(article.title, 110),
    description: truncate(article.excerpt, 200),
    image: article.image ? [article.image.src] : undefined,
    datePublished: article.date,
    dateModified: article.modified,
    inLanguage: "pa-IN",
    articleSection: article.categories[0]?.name,
    keywords: article.tags.map((t) => t.name).slice(0, 12).join(", ") || undefined,
    author: {
      "@type": "Organization",
      name: article.author?.name ?? SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
        width: 272,
        height: 90,
      },
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: SITE_NAME,
    alternateName: "Time TV",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: SITE_TAGLINE,
    inLanguage: "pa-IN",
  };
}

export function breadcrumbJsonLd(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
