import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /**
   * WordPress serves every URL with a trailing slash and all 20,627 posts are
   * indexed that way. Next strips it by default, which turned every single
   * live URL into a 308 redirect in parity testing. Matching WordPress keeps
   * the existing URLs byte-identical through the migration.
   */
  trailingSlash: true,
  /**
   * The WordPress origin falls over under parallel load, so the build is
   * deliberately throttled. Raise this only once the API sits behind a cache
   * or the origin moves off its current single box.
   */
  experimental: {
    cpus: Number(process.env.NEXT_BUILD_CPUS ?? 3),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "timetv.news", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "**.timetv.news", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "secure.gravatar.com" },
      { protocol: "https", hostname: "i0.wp.com" },
    ],
    formats: ["image/avif", "image/webp"],
    /**
     * Source photos top out around 500-1280px wide, so there is no point
     * generating 2048px variants: Next will not upscale past the source and
     * the extra breakpoints only fragment the cache.
     */
    deviceSizes: [320, 420, 540, 640, 768, 900, 1080, 1280],
    imageSizes: [96, 128, 160, 200, 256, 320, 384],
    /**
     * Higher than the default 75. Re-encoding an already-small, already-
     * compressed news photo at 75 stacks a second generation of artefacts on
     * top of the first, which reads as blur.
     */
    qualities: [75, 90],
    minimumCacheTTL: 2592000,
  },
  async headers() {
    /**
     * CSP is deliberately explicit about the third parties this site loads:
     * GTM, the Google tag, Comscore and the WordPress media origin. Anything
     * else is blocked, which is the point — a compromised article body cannot
     * reach out to a host that is not on this list.
     *
     * 'unsafe-inline' on script-src is required by GTM and by Next's inline
     * bootstrap. Removing it means nonce-ing every inline script, which is a
     * worthwhile follow-up but is not a silent change.
     */
    /**
     * Whether this deployment is actually served over HTTPS.
     *
     * Two headers depend on it. Sending either from a plain-HTTP localhost
     * server is wrong, and `Strict-Transport-Security` is actively harmful
     * there: with `includeSubDomains` a browser that honours it will force
     * https on every localhost origin, which breaks this app and every other
     * local project in that browser profile. RFC 6797 says a UA must ignore
     * HSTS over insecure transport, but Safari was observed refusing the
     * stylesheet and images anyway while the document rendered from cache.
     */
    const isHttps =
      /^https:/i.test(process.env.NEXT_PUBLIC_SITE_URL ?? "") ||
      // Same fallback as src/lib/seo.ts: a Vercel deployment is always https,
      // even when NEXT_PUBLIC_SITE_URL has not been set in project settings.
      Boolean(
        process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL,
      );

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.googletagmanager.com https://sb.scorecardresearch.com https://*.scorecardresearch.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://timetv.news https://*.timetv.news https://sb.scorecardresearch.com https://*.scorecardresearch.com https://www.googletagmanager.com https://www.google-analytics.com https://secure.gravatar.com https://i0.wp.com",
      "connect-src 'self' https://timetv.news https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://sb.scorecardresearch.com",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.facebook.com https://www.googletagmanager.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      /**
       * Sent only when the site is actually served over HTTPS.
       *
       * Over plain http://localhost this directive makes the browser upgrade
       * every same-origin request to https://localhost, which has no TLS.
       * Chromium and Firefox exempt localhost; WebKit does not — so in Safari
       * the stylesheet and every image fail and the page renders as raw HTML.
       *
       * Keying off NODE_ENV was not enough: `next start` is production mode,
       * so a local production preview broke in exactly the same way. The
       * public origin is the honest signal.
       */
      ...(isHttps ? ["upgrade-insecure-requests"] : []),
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          ...(isHttps
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The old theme exposed an AMP variant of every post. Headless does not
      // produce AMP, so fold those URLs back into the canonical article.
      { source: "/:slug/amp", destination: "/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
