import type {
  Article,
  Paged,
  Term,
  WPMedia,
  WPPost,
  WPTerm,
} from "./types";

const WP_URL = process.env.WP_URL ?? "https://timetv.news";
const API = `${WP_URL}/wp-json/wp/v2`;

/**
 * Fields a list view actually renders. Without this the API returns every
 * article body and the full Yoast payload, which pushed a 50-post request to
 * 3.1MB and past the limit of what Next will cache.
 */
const LIST_FIELDS = [
  "id",
  "date",
  "date_gmt",
  "modified",
  "modified_gmt",
  "slug",
  "link",
  "title",
  "excerpt",
  "author",
  "featured_media",
  "categories",
  "tags",
  "_links",
].join(",");

/**
 * How long each kind of response stays fresh. News needs the homepage to move
 * quickly while thirty-thousand taxonomy terms can sit still for an hour.
 * Publishing also fires an on-demand purge, so these are only the safety net.
 */
export const TTL = {
  home: 60,
  list: 120,
  article: 300,
  taxonomy: 3600,
} as const;

export const CACHE_TAGS = {
  posts: "posts",
  terms: "terms",
  post: (slug: string) => `post:${slug}`,
  term: (slug: string) => `term:${slug}`,
} as const;

/** Thrown when WordPress itself is unreachable, as opposed to missing content. */
export class OriginUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("WordPress origin unavailable");
    this.name = "OriginUnavailableError";
    this.cause = cause;
  }
}

class WPError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
  ) {
    super(message);
    this.name = "WPError";
  }
}

interface FetchOpts {
  revalidate?: number;
  tags?: string[];
}

/**
 * The WordPress origin is a single OVH box with no CDN, and it returns 500s
 * once a handful of requests land at the same time (measured: 5 of 14
 * concurrent requests failed). Builds and ISR regeneration both fan out, so
 * every call goes through a gate that caps how many are in flight at once.
 */
const MAX_CONCURRENT = Number(process.env.WP_MAX_CONCURRENCY ?? 4);
let inFlight = 0;
const waiting: Array<() => void> = [];

async function acquire(): Promise<void> {
  if (inFlight < MAX_CONCURRENT) {
    inFlight++;
    return;
  }
  await new Promise<void>((resolve) => waiting.push(resolve));
  inFlight++;
}

function release(): void {
  inFlight--;
  waiting.shift()?.();
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Circuit breaker.
 *
 * Bounding each request is not enough on its own: a page makes several calls,
 * so with the origin dead a single page still spent 3 x the budget and blew
 * past Next's 60s per-page build limit — which fails the whole build and
 * leaves nothing deployable.
 *
 * Once the origin has failed repeatedly it is almost certainly down, so there
 * is no value in waiting for every later call to time out too. The breaker
 * opens and subsequent calls fail instantly until the cooldown expires; one
 * success closes it again. Healthy traffic never notices it exists.
 */
const BREAKER_THRESHOLD = Number(process.env.WP_BREAKER_FAILURES ?? 4);
const BREAKER_COOLDOWN_MS = Number(process.env.WP_BREAKER_COOLDOWN_MS ?? 15_000);

let consecutiveFailures = 0;
let breakerOpenUntil = 0;

function breakerIsOpen(): boolean {
  return Date.now() < breakerOpenUntil;
}

function recordFailure(): void {
  consecutiveFailures += 1;
  if (consecutiveFailures >= BREAKER_THRESHOLD) {
    breakerOpenUntil = Date.now() + BREAKER_COOLDOWN_MS;
  }
}

function recordSuccess(): void {
  consecutiveFailures = 0;
  breakerOpenUntil = 0;
}

const RETRY_STATUS = new Set([429, 500, 502, 503, 504, 520, 521, 522, 524]);
const MAX_ATTEMPTS = Number(process.env.WP_MAX_ATTEMPTS ?? 6);
/** Base backoff in ms; the origin needs real breathing room between retries. */
const BACKOFF_BASE = Number(process.env.WP_BACKOFF_MS ?? 400);

/**
 * Per-attempt and total time budgets.
 *
 * Patience is right during a build — the origin is flaky and a retry costs
 * nothing but time. It is wrong while a reader waits: with six attempts at a
 * 20s timeout, a dead origin left the archive page spinning for 51 seconds
 * before it gave up. Nobody waits 51 seconds for a news site.
 *
 * The build gets a slightly larger budget than runtime, but it must stay well
 * under Next's own 60s per-page build timeout. A longer budget cannot help:
 * Next kills the page first and fails the entire build, which is how a dead
 * origin once destroyed a deployment.
 */
const ATTEMPT_TIMEOUT_MS = Number(process.env.WP_ATTEMPT_TIMEOUT_MS ?? 8_000);
const TOTAL_BUDGET_MS = Number(process.env.WP_TOTAL_BUDGET_MS ?? 9_000);

async function wpFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  opts: FetchOpts = {},
): Promise<{ data: T; total: number; totalPages: number }> {
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }

  if (breakerIsOpen()) {
    throw new WPError(
      `WordPress origin is failing; request short-circuited (${url.pathname})`,
      0,
      url.toString(),
    );
  }

  let lastError: unknown;
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    // Stop retrying once the budget is spent, however many attempts remain.
    if (attempt > 1 && Date.now() >= deadline) break;
    await acquire();
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(
          Math.max(1_000, Math.min(ATTEMPT_TIMEOUT_MS, deadline - Date.now())),
        ),
        next: {
          revalidate: opts.revalidate ?? TTL.list,
          tags: opts.tags,
        },
      });
    } catch (err) {
      lastError = err;
      release();
      if (attempt === MAX_ATTEMPTS) break;
      // Exponential backoff with jitter so retries do not re-synchronise.
      const wait = 2 ** attempt * BACKOFF_BASE + Math.random() * 400;
      if (Date.now() + wait >= deadline) break;
      await sleep(wait);
      continue;
    }
    release();

    if (res.ok) {
      recordSuccess();
      return {
        data: (await res.json()) as T,
        total: Number(res.headers.get("x-wp-total") ?? 0),
        totalPages: Number(res.headers.get("x-wp-totalpages") ?? 0),
      };
    }

    lastError = new WPError(
      `WordPress responded ${res.status} for ${url.pathname}`,
      res.status,
      url.toString(),
    );

    // A 404 is an answer, not a failure. Only transient codes are retried.
    if (!RETRY_STATUS.has(res.status) || attempt === MAX_ATTEMPTS) break;
    const wait = 2 ** attempt * BACKOFF_BASE + Math.random() * 400;
    if (Date.now() + wait >= deadline) break;
    await sleep(wait);
  }

  // A 4xx is the origin answering, not failing — it must not trip the breaker.
  const transport =
    !(lastError instanceof WPError) || lastError.status === 0 || lastError.status >= 500;
  if (transport) recordFailure();

  throw lastError instanceof Error
    ? lastError
    : new WPError(`WordPress request failed for ${url.pathname}`, 0, url.toString());
}

/* ------------------------------------------------------------------ *
 * Normalising
 * ------------------------------------------------------------------ */

/**
 * Turn an absolute WordPress URL into a path on our site.
 *
 * This matters more than it looks. Slugs on this site are percent-encoded
 * Gurmukhi, and WordPress stores them already encoded. Re-encoding them
 * ourselves is how a migration quietly changes twenty thousand URLs, so we
 * take the path straight from WordPress and never rebuild it by hand.
 */
export function toPath(link: string): string {
  try {
    const { pathname } = new URL(link);
    return pathname;
  } catch {
    return link.startsWith("/") ? link : `/${link}`;
  }
}

/** Strip HTML and decode the entities WordPress bakes into rendered strings. */
const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  hellip: "\u2026",
  mdash: "\u2014",
  ndash: "\u2013",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201c",
  rdquo: "\u201d",
  bull: "\u2022",
  deg: "\u00b0",
  eacute: "\u00e9",
  rupee: "\u20b9",
  middot: "\u00b7",
  laquo: "\u00ab",
  raquo: "\u00bb",
  times: "\u00d7",
  trade: "\u2122",
  copy: "\u00a9",
  reg: "\u00ae",
};

/**
 * Strip tags and decode entities. WordPress double-encodes a lot of
 * punctuation in rendered titles and excerpts; left alone it surfaces as
 * literal "[&hellip;]" at the end of every excerpt.
 */
export function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, d: string) =>
      String.fromCodePoint(Number(d)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(
      /&([a-z][a-z0-9]*);/gi,
      (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match,
    )
    .replace(/\s+/g, " ")
    .trim();
}

function pickImage(media?: WPMedia): Article["image"] {
  if (!media?.source_url) return null;
  const details = media.media_details;
  const sizes = details?.sizes ?? {};

  /**
   * Always take the widest rendition available.
   *
   * This previously asked for `medium_large`, which this install does not
   * generate, so it silently fell through to `medium` — 300px wide — and every
   * photo on the site was being upscaled from 300px. The widest rendition here
   * is usually `full`, which is the original upload.
   *
   * Note the originals themselves are small: sampling 50 posts, 92% are under
   * 600px wide with a median of 550px. We serve the best pixels that exist, but
   * the newsroom has to start uploading larger images for this to improve
   * further. No front end can invent detail that was never uploaded.
   */
  type Candidate = { source_url: string; width: number; height: number };
  const area = (c: Candidate) => c.width * c.height;

  // Compared by pixel area, not width alone: this install generates several
  // crops at the same width (500x261 and 500x300), and picking on width would
  // hand us whichever came first and throw away rows of real detail.
  let best: Candidate | null = null;
  for (const size of Object.values(sizes)) {
    if (!size?.source_url || !size.width || !size.height) continue;
    const candidate: Candidate = {
      source_url: size.source_url,
      width: size.width,
      height: size.height,
    };
    if (!best || area(candidate) > area(best)) best = candidate;
  }

  // The bare source_url is the original upload; prefer it when nothing
  // generated beats it.
  const original: Candidate = {
    source_url: media.source_url,
    width: details?.width ?? 0,
    height: details?.height ?? 0,
  };
  if (original.width && original.height && (!best || area(original) >= area(best))) {
    best = original;
  }
  if (!best) {
    best = { source_url: media.source_url, width: 1200, height: 675 };
  }

  return {
    src: best.source_url,
    alt: stripHtml(media.alt_text),
    width: best.width,
    height: best.height,
  };
}

function toTerm(t: WPTerm): Term {
  return {
    id: t.id,
    name: stripHtml(t.name),
    slug: t.slug,
    path: toPath(t.link),
    count: t.count ?? 0,
    taxonomy: t.taxonomy,
  };
}

export function toArticle(post: WPPost): Article {
  const embeddedTerms = post._embedded?.["wp:term"] ?? [];
  const flatTerms = embeddedTerms.flat().filter(Boolean);
  const author = post._embedded?.author?.[0];

  return {
    id: post.id,
    slug: post.slug,
    path: toPath(post.link),
    title: stripHtml(post.title?.rendered),
    excerpt: stripHtml(post.excerpt?.rendered),
    content: post.content?.rendered ?? "",
    date: post.date_gmt ? `${post.date_gmt}Z` : post.date,
    modified: post.modified_gmt ? `${post.modified_gmt}Z` : post.modified,
    author: author
      ? { name: stripHtml(author.name), avatar: author.avatar_urls?.["96"] }
      : null,
    image: pickImage(post._embedded?.["wp:featuredmedia"]?.[0]),
    categories: flatTerms.filter((t) => t.taxonomy === "category").map(toTerm),
    tags: flatTerms.filter((t) => t.taxonomy === "post_tag").map(toTerm),
    seo: post.yoast_head_json,
  };
}

/* ------------------------------------------------------------------ *
 * Queries
 * ------------------------------------------------------------------ */

export interface PostQuery {
  page?: number;
  perPage?: number;
  categories?: number | string;
  tags?: number | string;
  search?: string;
  exclude?: number[];
  sticky?: boolean;
  /** ISO datetime, inclusive lower bound (WordPress `after`). */
  after?: string;
  /** ISO datetime, inclusive upper bound (WordPress `before`). */
  before?: string;
}

export async function getPosts(
  q: PostQuery = {},
  opts: FetchOpts = {},
): Promise<Paged<Article>> {
  const page = q.page ?? 1;
  let data: WPPost[];
  let total = 0;
  let totalPages = 0;
  try {
    ({ data, total, totalPages } = await wpFetchPosts(q, page, opts));
  } catch (err) {
    // Asking for page 99999 is a 400 from WordPress, not an outage. Treat it
    // as an empty page so the route renders a clean 404 instead of a 500.
    if (err instanceof WPError && err.status === 400) {
      return { items: [], total: 0, totalPages: 0, page };
    }
    throw err;
  }
  return { items: data.map(toArticle), total, totalPages, page };
}

async function wpFetchPosts(
  q: PostQuery,
  page: number,
  opts: FetchOpts,
): Promise<{ data: WPPost[]; total: number; totalPages: number }> {
  return wpFetch<WPPost[]>(
    "/posts",
    {
      page,
      per_page: q.perPage ?? 12,
      categories: q.categories,
      tags: q.tags,
      search: q.search,
      after: q.after,
      before: q.before,
      exclude: q.exclude?.join(","),
      _embed: "wp:featuredmedia,wp:term,author",
      _fields: LIST_FIELDS,
    },
    { revalidate: opts.revalidate ?? TTL.list, tags: [CACHE_TAGS.posts, ...(opts.tags ?? [])] },
  );
}

export async function getPostBySlug(slug: string): Promise<Article | null> {
  let data: WPPost[];
  try {
    ({ data } = await wpFetch<WPPost[]>(
      "/posts",
      { slug, per_page: 1, _embed: "wp:featuredmedia,wp:term,author" },
      { revalidate: TTL.article, tags: [CACHE_TAGS.posts, CACHE_TAGS.post(slug)] },
    ));
  } catch (err) {
    // An empty result means "no such post" (404). A transport failure means
    // the CMS is down (503) — a very different thing to tell a crawler.
    throw new OriginUnavailableError(err);
  }
  return data[0] ? toArticle(data[0]) : null;
}

/** Slugs only. Used by generateStaticParams, which has no use for embeds. */
export async function getRecentSlugs(limit = 50): Promise<string[]> {
  const { data } = await wpFetch<Array<{ slug: string }>>(
    "/posts",
    { per_page: limit, _fields: "slug" },
    { revalidate: TTL.home, tags: [CACHE_TAGS.posts] },
  );
  return data.map((p) => p.slug).filter(Boolean);
}

/** Totals and modified dates only, for building sitemaps cheaply. */
export async function getSitemapPage(page: number, perPage = 100) {
  const { data, total } = await wpFetch<
    Array<{ link: string; modified_gmt: string }>
  >(
    "/posts",
    { per_page: perPage, page, _fields: "link,modified_gmt" },
    { revalidate: TTL.taxonomy, tags: [CACHE_TAGS.posts] },
  );
  return {
    total,
    items: data.map((p) => ({
      path: toPath(p.link),
      modified: p.modified_gmt ? new Date(`${p.modified_gmt}Z`) : new Date(),
    })),
  };
}

export async function getCategories(): Promise<Term[]> {
  const { data } = await wpFetch<WPTerm[]>(
    "/categories",
    { per_page: 100, orderby: "count", order: "desc", hide_empty: 1 },
    { revalidate: TTL.taxonomy, tags: [CACHE_TAGS.terms] },
  );
  return data.map(toTerm).filter((t) => t.count > 0);
}

export async function getTermBySlug(
  taxonomy: "categories" | "tags",
  slug: string,
): Promise<Term | null> {
  let data: WPTerm[];
  try {
    ({ data } = await wpFetch<WPTerm[]>(
      `/${taxonomy}`,
      { slug, per_page: 1 },
      { revalidate: TTL.taxonomy, tags: [CACHE_TAGS.terms, CACHE_TAGS.term(slug)] },
    ));
  } catch (err) {
    // As with articles: an empty result is a genuine 404, a transport failure
    // is a 503. Returning null here would 404 every category the moment the
    // CMS hiccupped, which is how whole sections fall out of Google.
    throw new OriginUnavailableError(err);
  }
  return data[0] ? toTerm(data[0]) : null;
}

/**
 * Walk every page of a date range, yielding batches as they arrive.
 *
 * Used by the archive export. Pages are fetched one at a time on purpose: the
 * WordPress origin returns 500s under parallel load, and an export of several
 * thousand articles is exactly the kind of fan-out that trips it. Yielding
 * rather than collecting also keeps memory flat however large the range is.
 */
export async function* walkDateRange(
  opts: {
    after: string;
    before: string;
    categories?: number | string;
    perPage?: number;
    maxPosts?: number;
    withContent?: boolean;
  },
): AsyncGenerator<Article[]> {
  const perPage = Math.min(opts.perPage ?? 100, 100);
  const maxPosts = opts.maxPosts ?? 5000;

  let page = 1;
  let sent = 0;

  while (sent < maxPosts) {
    const { data, totalPages } = await wpFetch<WPPost[]>(
      "/posts",
      {
        after: opts.after,
        before: opts.before,
        categories: opts.categories,
        per_page: perPage,
        page,
        orderby: "date",
        order: "desc",
        _embed: "wp:featuredmedia,wp:term,author",
        // Bodies are only pulled when the caller actually wants them.
        _fields: opts.withContent ? `${LIST_FIELDS},content` : LIST_FIELDS,
      },
      { revalidate: TTL.list },
    );

    if (data.length === 0) return;

    const batch = data.map(toArticle);
    const room = maxPosts - sent;
    yield batch.length > room ? batch.slice(0, room) : batch;
    sent += batch.length;

    if (page >= totalPages) return;
    page += 1;
  }
}

/** How many posts a date range holds, without pulling them. */
export async function countDateRange(
  after: string,
  before: string,
  categories?: number | string,
): Promise<number> {
  const { total } = await wpFetch<WPPost[]>(
    "/posts",
    { after, before, categories, per_page: 1, _fields: "id" },
    { revalidate: TTL.list },
  );
  return total;
}

/**
 * The homepage needs several category rails at once. Fetching them in
 * parallel keeps the render inside one round-trip budget rather than
 * stacking a dozen sequential calls.
 */
export async function getCategoryRails(
  terms: Term[],
  perRail = 5,
): Promise<Array<{ term: Term; items: Article[] }>> {
  const rails = await Promise.all(
    terms.map(async (term) => {
      try {
        const { items } = await getPosts(
          { categories: term.id, perPage: perRail },
          { revalidate: TTL.home },
        );
        return { term, items };
      } catch {
        // A single failing rail must not take the homepage down with it.
        return { term, items: [] as Article[] };
      }
    }),
  );
  return rails.filter((r) => r.items.length > 0);
}
