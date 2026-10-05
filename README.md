# Chardikla Time TV — Headless Front End

A Next.js front end for [timetv.news](https://timetv.news), reading content from
the existing WordPress install over the REST API. WordPress stays exactly where
it is as the editing back end; this app replaces only what the public sees.

**Nothing about the newsroom workflow changes.** Editors keep the same admin,
the same login and the same Publish button.

---

## Quick start

```bash
pnpm install
cp .env.example .env.local   # then fill in REVALIDATE_SECRET
pnpm dev                     # http://localhost:3000
```

Production build:

```bash
pnpm build && pnpm start
```

## Environment

| Variable | Purpose |
| --- | --- |
| `WP_URL` | WordPress origin serving the REST API. Default `https://timetv.news`. |
| `NEXT_PUBLIC_SITE_URL` | Public origin, used for canonicals, OG tags and sitemaps. |
| `REVALIDATE_SECRET` | Shared secret for the publish webhook. `openssl rand -hex 32`. |
| `WP_MAX_CONCURRENCY` | Max simultaneous requests to WordPress. Default 4, build uses 1. |
| `WP_MAX_ATTEMPTS` | Retry attempts per request. Default 6. |
| `NEXT_BUILD_CPUS` | Build worker count. Kept low on purpose — see below. |

---

## Architecture

```
WordPress (unchanged)          Next.js front end            Reader
  wp-json/wp/v2/  ──fetch──▶   ISR-cached pages   ──HTML──▶  browser
        │
        └── publish ──webhook──▶ /api/revalidate ──▶ purge + regenerate
```

- **Rendering** — static with incremental regeneration. Pages are served as
  prebuilt HTML and refreshed in the background.
- **Revalidation windows** — homepage 60s, archives 120s, articles 300s,
  taxonomies 1h. These are the safety net; publishing purges immediately.
- **Pre-rendering** — the 50 newest posts and all categories are built up front.
  The remaining ~20,500 posts and ~24,700 tags generate on first request and
  cache from there, which keeps builds to roughly two minutes.

### Routes

| Route | Notes |
| --- | --- |
| `/` | Homepage: ticker, lead story, latest grid, category rails |
| `/[slug]/` | Article |
| `/category/[slug]/` + `/page/[n]/` | Category archive, paginated |
| `/tag/[slug]/` + `/page/[n]/` | Tag archive, paginated |
| `/latest/` + `/page/[n]/` | All posts |
| `/search/` | Search, `noindex` |
| `/archive/` | Date-range archive browser with CSV/JSON export |
| `/api/export/` | Streaming CSV/JSON download (GET), range count (HEAD) |
| `/about/`, `/contact/`, `/privacy-policy/` | **Placeholder copy — client must supply** |
| `/sitemap.xml` | Split into chunks of 1,000 URLs |
| `/news-sitemap.xml` | Google News sitemap, last 48 hours |
| `/feed/` | RSS 2.0, excerpt-only |
| `/manifest.webmanifest` | PWA manifest |
| `/api/revalidate/` | Publish webhook (POST, note the trailing slash) |

---

## Things that were not obvious, and why the code looks the way it does

These are decisions a future maintainer would otherwise undo by accident.

### 1. Trailing slashes are mandatory

`trailingSlash: true` is not a style preference. WordPress serves every URL with
a trailing slash and all 20,627 posts are indexed that way. With Next's default
the parity test returned **308 redirects on 120 of 120 live URLs**. Turning this
off would put a redirect hop in front of the entire indexed site.

### 2. Internal links are never rebuilt by hand

Slugs on this site are percent-encoded Gurmukhi, stored by WordPress already
encoded (`/category/%e0%a8%aa%e0%a9%b0%e0%a8%9c%e0%a8%be%e0%a8%ac/`). Every
internal path is taken from WordPress's own `link` field via `toPath()` rather
than re-encoded locally. Re-encoding is how a migration silently changes twenty
thousand URLs.

### 3. Punjabi dates do not use `Intl`'s `pa` locale

Chromium ships without `pa` locale data and renders `4 ਅਕਤੂਬਰ` as **`M10 4`**.
Node has the data, so server-rendered dates look correct while anything
client-rendered breaks — and the audience is largely on low-end Android with
trimmed ICU builds. `src/lib/format.ts` therefore carries explicit Punjabi month
and weekday names. Timezone resolution still uses `Intl` with `en-GB`, which is
always present.

**Do not "simplify" this back to `toLocaleDateString('pa-IN')`.**

### 4. The WordPress origin cannot take parallel load

Measured: **5 of 14 concurrent API requests returned HTTP 500.** The origin is a
single OVH box in Mumbai with no CDN. Two consequences:

- `src/lib/wp.ts` gates every request through a concurrency limiter and retries
  transient failures with exponential backoff and jitter.
- Builds run with `WP_MAX_CONCURRENCY=1` and only 2 workers. Raising either will
  fail the build.

This is a hosting problem, not a code problem. Once the API sits behind a cache
or the origin moves, both limits can be raised.

### 5. Never add `loading.tsx` above a route that can 404

A `loading.tsx` opens a Suspense boundary, so Next starts streaming and flushes
**HTTP 200 before the page body runs**. With a root-level loading file, every
missing article, category and tag returned the 404 page with a 200 status —
soft 404s across the whole site, which is one of the worst things you can do to
a news site's index.

The skeleton now lives only at `src/app/search/loading.tsx`, where the route is
always a 200. Verified: missing article, bad category and bad tag all return
404; real pages return 200.

### 6. List queries ask for specific fields

Requesting 50 posts with `_embed` returned **3.1 MB**, over the 2 MB ceiling for
Next's data cache, so nothing cached at all. `LIST_FIELDS` drops article bodies
and the Yoast payload from list views, bringing the same request to 1.37 MB.

### 7. The news sitemap and RSS feed are not optional

The live site publishes `/news-sitemap.xml` (via Yoast News) and `/feed/`. Those
are how Google News, Discover and a number of Punjabi news apps pick this
publisher up, so dropping either in the migration would cost real traffic. Both
are reimplemented here.

The news sitemap also fixes two faults in the current one: its `<news:name>` is
empty, and it declares `<news:language>en</news:language>` when the content is
Punjabi. Ours sends the publication name and `pa`.

### 8. Image quality is capped by what the newsroom uploads

Two separate problems caused blurry photos. Only one was ours.

**Ours:** `pickImage` asked for the `medium_large` rendition, which this install
does not generate, so it silently fell through to `medium` — **300px wide** —
and every photo on the site was upscaled from 300px. It now picks the widest
rendition by *pixel area*, not width: this install produces several crops at the
same width (500x261 and 500x300) and comparing on width alone threw away rows of
real detail. Measured on the hero slot: **300x180 to 500x300, 2.8x the pixels**,
and quality raised from 75 to 90 so re-encoding does not stack a second
generation of artefacts on an already-compressed photo.

**Theirs, and not fixable in code:** sampling 50 posts, **92% of featured images
are under 600px wide, median 550px**. The uploaded originals really are that
small — `full` is 500x300. A 500px photo rendered in a 700px hero slot on a 2x
screen is a 2.8x upscale no front end can rescue.

This is why the homepage leans on type: the numbered `TopStories` column carries
the page without photographs, grid thumbnails are rendered small enough to stay
sharp, and the hero gradient is deeper than fashion alone would require.

**Ask the client to upload at 1200px wide or more.** That single change in
newsroom practice will do more for how the site looks than anything left in this
codebase.

### 9. The archive export streams, and says when it truncates

`/archive/` lets anyone pick a date range and pull those articles as CSV or
JSON. Three things in there are deliberate:

- **It streams.** A 60-day range is roughly 4,000 articles. Building that in
  memory and then sending it would spike memory and hold the origin open; the
  route yields rows as pages arrive and walks WordPress one page at a time,
  because parallel fetches are what trip their server.
- **The CSV carries a UTF-8 BOM.** Without it Excel opens Gurmukhi as mojibake,
  which for a Punjabi newsroom makes the export worthless.
- **It caps at 5,000 posts and says so.** A one-year range is ~24,000 articles.
  Rather than truncate silently, the page warns in Punjabi once the count passes
  the cap and tells the user to pull shorter ranges. If you raise `MAX_POSTS`,
  raise `MAX_EXPORT` in `ArchiveFilters.tsx` to match.

CSV cells starting with `=`, `+`, `-` or `@` are prefixed with an apostrophe, so
a headline cannot execute as a spreadsheet formula.

### 10. Analytics must be told about client-side navigation

GTM (`GTM-WCZ9FS38`), the Site Kit Google tag (`GT-K8FZD2W`) and Comscore
(`c2=41969248`) are all live. The IDs were read off the live site's own HTML —
none of them needed portal access, which is worth knowing given the Comscore
login is still blocked. That login is for *reading reports*; it was never
required to run the tag.

The part that matters: on the old site every click was a full page load, so each
tag counted itself. Here routing happens in the browser, so `Analytics.tsx`
fires a page view on every route change. Without it, analytics would record the
first page a reader lands on and nothing after — traffic would appear to
collapse the day you cut over, and it would look like an SEO disaster rather
than a measurement bug.

Verified in a real browser: on client-side navigation with no document reload, a
`pageview` lands in `dataLayer`, Comscore sends a `/b?` beacon, and GA records
the hit.

### 11. Colour tokens are split by role, and must stay that way

Three tokens (`brand`, `accent`, `live`) each do two jobs: they sit behind
white text as a background, and they sit on the page surface as text. Those two
jobs need opposite treatment in dark mode, and collapsing them back into one
token silently breaks contrast.

Each therefore has a surface role and a text role:

| Background (white text on it) | Text (on the page surface) |
| --- | --- |
| `--color-brand` #0c0c9c | `--color-brand-ink` — #8f8fff in dark |
| `--color-accent-chip` #c2410c | `--color-accent-ink` — #ff8c42 in dark |
| `--color-live` #d81920 | `--color-live-ink` — #ff7a7a in dark |

`--color-accent` (#fc600c, the logo orange) is decorative only — it is 3.08:1
against white and fails AA for any text. `--color-accent-on-dark` (#ff8c42)
exists because even the logo orange is 4.40:1 on the blue masthead, just under
the bar.

Measured before the split: 61 contrast violations on the homepage alone.

### 12. `upgrade-insecure-requests` is keyed off the real scheme, at build time

Two things to know, because getting either wrong breaks the site visibly.

**It is sent only when `NEXT_PUBLIC_SITE_URL` is https.** Over plain
`http://localhost` the directive makes the browser upgrade every same-origin
request to `https://localhost`, which has no TLS. Chromium and Firefox exempt
localhost; **WebKit does not** — so in Safari the stylesheet and every image
fail and the page renders as raw unstyled HTML. Keying it off `NODE_ENV` was
not enough: `next start` is production mode, so a local production preview
broke in exactly the same way.

**`headers()` is evaluated at build time**, not at start. Next serialises the
result into `routes-manifest.json`, so setting the variable when starting the
server does nothing — it must be set when building. Verified both ways: a build
with an https origin bakes the directive in, a local build does not.

### 12b. (historic note) upgrade-insecure-requests

The CSP carries it, but only when `NODE_ENV === "production"`. Over plain
`http://localhost` it makes the browser upgrade same-origin image requests to
`https://localhost`, which has no TLS. Chromium and Firefox exempt localhost;
**WebKit does not**, so sending it in development breaks every image in Safari
and in any Playwright WebKit run — which is precisely where you would test
Safari. Verified: 40 of 41 images broken with it on, 0 broken with it scoped.

### 13. robots.txt must point at a sitemap that exists

Next reserves `/sitemap.xml` for its own metadata route, and `generateSitemaps`
emits `/sitemap/0.xml`, `/sitemap/1.xml` … without an index. robots.txt
advertised `/sitemap.xml`, which **404s** — Google would have fetched it, got
nothing, and discovered none of the 21 chunks. The index now lives at
`/sitemap-index.xml` and robots.txt points there.

### 14. The build must survive the origin being down

timetv.news went fully offline mid-session (ports 80 and 443 unreachable). That
exposed three compounding faults, all now fixed:

1. **A failed build destroys the previous one.** Next clears `.next` before
   rebuilding, so a build that dies halfway leaves no `prerender-manifest.json`
   and the site cannot serve *at all* — not even the last good version.
2. **Next kills any page taking over 60s to build.** The retry budget was set
   to 180s on the theory that patience helps during a build. It cannot: the
   page is killed first and the whole build fails. The build budget is now 25s.
3. **Per-request budgets are not enough.** A single page makes three or four
   calls, so a dead origin still blew past 60s. `src/lib/wp.ts` now has a
   **circuit breaker**: after 4 consecutive transport failures it opens for 15s
   and short-circuits instantly. A 4xx is the origin answering, not failing, so
   it never trips the breaker.

Verified against the real outage: the build completed, and every route served
in **under 50ms** with a Punjabi "temporarily unavailable" notice instead of a
stack trace.

### 15. SEO comes from Yoast, not from us

Yoast already carries the metadata this site earned across 20,627 posts, exposed
as `yoast_head_json`. `src/lib/seo.ts` reuses those titles, descriptions,
canonicals and robots directives rather than inventing new ones. Titles use
`{ absolute: ... }` because Yoast titles already include the brand.

Schema is emitted fresh against our own origin: `NewsArticle` + `BreadcrumbList`
per article, `NewsMediaOrganization` site-wide.

---

## The publish webhook

Copy `wordpress-plugin/timetv-headless-revalidate.php` into
`wp-content/mu-plugins/` on the WordPress install, then add to `wp-config.php`:

```php
define('HEADLESS_FRONTEND_URL', 'https://timetv.news');
define('HEADLESS_REVALIDATE_SECRET', 'same value as REVALIDATE_SECRET');
```

Publishing then refreshes the article, its category archives, the homepage and
`/latest` within seconds. Test it with:

Note the trailing slash on the endpoint — `trailingSlash: true` applies to route
handlers too, and posting to `/api/revalidate` without it returns a 308.

```bash
curl -X POST http://localhost:3000/api/revalidate/ \
  -H 'Content-Type: application/json' \
  -d '{"secret":"YOUR_SECRET","slug":"some-post-slug"}'
```

---

## Production readiness audit

Audited against the Master QA Engineer standard (18 phases) and the EthixWeb
Full-Stack Ready Checklist (9 sections), over three passes. Ten findings were
raised and fixed; the notes above record the ones a future change could undo.

| Area | Result |
| --- | --- |
| Accessibility (axe-core, WCAG 2.1 AA) | 0 violations across 6 pages, light **and** dark |
| Keyboard navigation | Skip link first, visible focus on every control |
| Tap targets (WCAG 2.5.8) | 40 under-size → 0 (skip link excepted by design) |
| Responsive | 9 widths, 320–2560px, no overflow anywhere |
| Cross-browser | Chromium, Firefox, WebKit — 0 errors, 0 broken images |
| Security headers | CSP, HSTS, Permissions-Policy, X-Frame-Options, Referrer-Policy, nosniff |
| XSS | `sanitize-html` allow-list; 10 attack vectors neutralised |
| Rate limiting | Export 5/min, revalidate 120/min, per IP |
| Core Web Vitals | CLS 0.000, FCP 36–40ms, LCP 36–40ms (localhost) |
| URL parity | 120/120 sampled live URLs resolve |
| Build | 111 pages, 0 errors, 0 warnings |
| Scenario suite | 191 scenarios across routing, security, SEO, typography, resilience |
| Origin outage | Build completes and every route serves with WordPress fully offline |

## Verification

```bash
pnpm check     # typecheck + lint
pnpm build     # full production build
```

Measured against the live site on 4 October 2026:

| | Live WordPress | This front end |
| --- | --- | --- |
| Homepage HTML | 488 KB | 242 KB |
| Article HTML | 217 KB | 91 KB |
| Stylesheets | 6 | 1 |
| Scripts | 17 | 9 |
| Inline `<style>` blocks | 81 | 0 |
| URL parity | — | 120 / 120 sampled live URLs resolve |
| Hero image delivered | 300x180 @ q75 | 500x300 @ q90 |

---

## Before launch

- [ ] Postal address and phone for `/contact` (email is verified; these are not)
- [ ] Legal review of `/privacy-policy`
- [ ] Tell the newsroom to upload featured images at 1200px wide or more
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production origin
- [ ] Generate a real `REVALIDATE_SECRET` and install the mu-plugin
- [x] Google Tag Manager, Google tag and Comscore — live and verified
- [ ] Decide whether AMP is being dropped; add redirects if so
- [ ] Put a CDN in front of the WordPress origin, then raise the concurrency caps
- [ ] Lock WordPress down to admin-only once it stops serving the public
- [ ] Run the URL parity check against the full sitemap, not a 120-URL sample
- [ ] Resubmit both sitemaps in Search Console after cutover
- [ ] Confirm the newsroom never publishes more than 100 posts in 48h, or raise
      the fetch size in `news-sitemap.xml` (Google allows up to 1,000)
