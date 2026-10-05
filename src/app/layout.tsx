import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Gurmukhi } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import Analytics from "@/components/Analytics";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SITE_NAME, SITE_TAGLINE, SITE_URL, organizationJsonLd } from "@/lib/seo";

const gurmukhi = Noto_Sans_Gurmukhi({
  subsets: ["gurmukhi", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-gurmukhi",
  display: "swap",
  // The audience is largely on mid-range Android. Preload keeps the first
  // paint from flashing a fallback that has no Gurmukhi glyphs at all.
  preload: true,
});

const latin = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-latin",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - ${SITE_TAGLINE}`,
    template: `%s - ${SITE_NAME}`,
  },
  description:
    "ਪੰਜਾਬ, ਦੇਸ਼ ਅਤੇ ਦੁਨੀਆ ਦੀਆਂ ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ। Breaking Punjabi news, politics, sports and entertainment from Chardikla Time TV.",
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "pa_IN",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${SITE_URL}/feed/` },
  },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0c0c9c" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1013" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pa-IN" className={`${gurmukhi.variable} ${latin.variable}`}>
      <head>
        {/* Applies the saved theme before first paint. Running this in a
            component instead would render the wrong colours for one frame on
            every load, which is what makes a dark theme feel broken. It is
            deliberately tiny, synchronous and failure-tolerant. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("ctv-theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`,
          }}
        />
        {/* The images still come from the WordPress origin, so warm it early. */}
        <link rel="preconnect" href="https://timetv.news" />
        <link rel="dns-prefetch" href="https://timetv.news" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE_NAME} RSS`}
          href="/feed/"
        />
      </head>
      <body className="min-h-dvh bg-surface text-ink antialiased">
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=GTM-WCZ9FS38`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          ਮੁੱਖ ਸਮੱਗਰੀ ਉੱਤੇ ਜਾਓ
        </a>
        {/* useSearchParams needs a Suspense boundary; this one wraps no UI,
            so it cannot stream a 200 ahead of a notFound() the way a
            loading.tsx would. */}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <Script
          id="org-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
      </body>
    </html>
  );
}
