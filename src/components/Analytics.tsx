"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { ANALYTICS } from "@/lib/site";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    COMSCORE?: { beacon: (o: Record<string, string>) => void };
    _comscore?: unknown[];
  }
}

/**
 * Fires a page view on client-side navigation.
 *
 * This is the part that quietly breaks when a WordPress site goes headless.
 * On the old site every click was a full page load, so each tag fired itself.
 * Here routing happens in the browser, so GTM, the Google tag and Comscore all
 * need telling by hand — otherwise analytics records the first page a reader
 * lands on and nothing after it, and traffic appears to collapse overnight.
 */
function useRouteChangeBeacon() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The tags already count the initial load themselves; skip the first run
  // so the landing page is not counted twice.
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }

    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname;
    const url = `${window.location.origin}${path}`;

    window.dataLayer?.push({ event: "pageview", page_path: path, page_location: url });

    window.gtag?.("event", "page_view", {
      page_path: path,
      page_location: url,
      page_title: document.title,
    });

    window.COMSCORE?.beacon({
      c1: ANALYTICS.comscoreC1,
      c2: ANALYTICS.comscoreC2,
    });
  }, [pathname, searchParams]);
}

export default function Analytics() {
  useRouteChangeBeacon();

  return (
    <>
      {/* Google Tag Manager */}
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${ANALYTICS.gtmId}');`}
      </Script>

      {/* Google tag (Site Kit) */}
      <Script
        id="gtag-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.googleTagId}`}
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ANALYTICS.googleTagId}');`}
      </Script>

      {/* Comscore — matches the configuration on the existing site. */}
      <Script id="comscore" strategy="afterInteractive">
        {`var _comscore = _comscore || [];
_comscore.push({ c1: "${ANALYTICS.comscoreC1}", c2: "${ANALYTICS.comscoreC2}", options: { enableFirstPartyCookie: "false" } });
(function() {
  var s = document.createElement("script"), el = document.getElementsByTagName("script")[0];
  s.async = true;
  s.src = "https://sb.scorecardresearch.com/cs/${ANALYTICS.comscoreC2}/beacon.js";
  el.parentNode.insertBefore(s, el);
})();`}
      </Script>

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://sb.scorecardresearch.com/p?c1=${ANALYTICS.comscoreC1}&c2=${ANALYTICS.comscoreC2}&cv=3.9.1&cj=1`}
          alt=""
          width={1}
          height={1}
          style={{ position: "absolute" }}
        />
      </noscript>
    </>
  );
}
