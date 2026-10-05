import { countDateRange, walkDateRange } from "@/lib/wp";
import { stripHtml } from "@/lib/wp";
import { SITE_URL } from "@/lib/seo";
import { clientKey, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
/** Large ranges take a while against a slow origin. */
export const maxDuration = 300;

/** Ceiling per request, so one export cannot sit on the origin all day. */
const MAX_POSTS = 5000;

/**
 * A full export can issue 50 sequential calls to WordPress, so downloads are
 * limited far more tightly than the cheap HEAD count the UI polls.
 */
const DOWNLOAD_LIMIT = { max: 5, windowMs: 60_000 };
const COUNT_LIMIT = { max: 60, windowMs: 60_000 };

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

function csvCell(value: string | number | null | undefined): string {
  const v = String(value ?? "");
  // Guard against spreadsheet formula injection from article titles.
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

const COLUMNS = [
  "date_ist",
  "title",
  "category",
  "tags",
  "author",
  "url",
  "excerpt",
] as const;

export async function GET(request: Request) {
  const limited = rateLimit(
    clientKey(request, "export"),
    DOWNLOAD_LIMIT.max,
    DOWNLOAD_LIMIT.windowMs,
  );
  if (!limited.ok) {
    return Response.json(
      {
        error: "Too many exports. Please wait a moment and try again.",
        retryAfterSeconds: limited.retryAfterSeconds,
      },
      { status: 429, headers: rateLimitHeaders(limited) },
    );
  }

  const { searchParams } = new URL(request.url);

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  const category = searchParams.get("category") ?? undefined;
  const withContent = searchParams.get("content") === "1";

  if (!isValidDate(from) || !isValidDate(to)) {
    return Response.json(
      { error: "Pass ?from=YYYY-MM-DD&to=YYYY-MM-DD" },
      { status: 400 },
    );
  }
  if (from > to) {
    return Response.json(
      { error: "`from` must not be later than `to`" },
      { status: 400 },
    );
  }
  if (!["csv", "json"].includes(format)) {
    return Response.json(
      { error: "format must be csv or json" },
      { status: 400 },
    );
  }

  // WordPress compares against site-local time; IST is UTC+5:30.
  const after = `${from}T00:00:00`;
  const before = `${to}T23:59:59`;

  const columns = withContent ? [...COLUMNS, "content"] : [...COLUMNS];
  const encoder = new TextEncoder();
  const filename = `timetv-news-${from}_to_${to}.${format}`;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (s: string) => controller.enqueue(encoder.encode(s));

      try {
        if (format === "csv") {
          // UTF-8 BOM: without it Excel opens Gurmukhi as mojibake, which for
          // a Punjabi newsroom makes the whole export useless.
          push("﻿");
          push(`${columns.join(",")}\n`);
        } else {
          push(`{"site":${JSON.stringify(SITE_URL)},`);
          push(`"from":${JSON.stringify(from)},"to":${JSON.stringify(to)},`);
          push(`"generated":${JSON.stringify(new Date().toISOString())},`);
          push(`"posts":[`);
        }

        let first = true;
        for await (const batch of walkDateRange({
          after,
          before,
          categories: category,
          maxPosts: MAX_POSTS,
          withContent,
        })) {
          for (const a of batch) {
            const row = {
              date_ist: a.date,
              title: a.title,
              category: a.categories.map((c) => c.name).join(" | "),
              tags: a.tags.map((t) => t.name).join(" | "),
              author: a.author?.name ?? "",
              url: `${SITE_URL}${a.path}`,
              excerpt: a.excerpt,
              ...(withContent ? { content: stripHtml(a.content) } : {}),
            };

            if (format === "csv") {
              push(
                `${columns
                  .map((c) => csvCell(row[c as keyof typeof row]))
                  .join(",")}\n`,
              );
            } else {
              push((first ? "" : ",") + JSON.stringify(row));
              first = false;
            }
          }
        }

        if (format === "json") push("]}");
        controller.close();
      } catch (err) {
        // The stream has already started, so we cannot change the status code.
        // Write the failure into the payload instead of truncating silently.
        const message = err instanceof Error ? err.message : "export failed";
        if (format === "json") {
          push(`],"error":${JSON.stringify(message)}}`);
        } else {
          push(`\n"EXPORT FAILED","${message.replace(/"/g, "'")}"\n`);
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":
        format === "csv"
          ? "text/csv; charset=utf-8"
          : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
      "X-Max-Posts": String(MAX_POSTS),
      ...rateLimitHeaders(limited),
    },
  });
}

/** Lets the archive page show a count before anyone starts a big download. */
export async function HEAD(request: Request) {
  const limited = rateLimit(
    clientKey(request, "export-count"),
    COUNT_LIMIT.max,
    COUNT_LIMIT.windowMs,
  );
  if (!limited.ok) {
    return new Response(null, {
      status: 429,
      headers: rateLimitHeaders(limited),
    });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  if (!isValidDate(from) || !isValidDate(to)) {
    return new Response(null, { status: 400 });
  }
  try {
    const total = await countDateRange(
      `${from}T00:00:00`,
      `${to}T23:59:59`,
      searchParams.get("category") ?? undefined,
    );
    return new Response(null, { headers: { "X-Total-Posts": String(total) } });
  } catch {
    return new Response(null, { status: 502 });
  }
}
