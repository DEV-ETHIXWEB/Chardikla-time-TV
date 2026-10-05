import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/wp";
import HeaderNav from "./HeaderNav";
import LiveClock from "./LiveClock";
import SocialLinks from "./SocialLinks";

/**
 * Server component so the category list is baked into the HTML. The old site
 * had no usable menu endpoint (wp/v2/menus returns 401), so navigation is
 * derived from categories ordered by post count, which matches what the
 * newsroom actually publishes.
 */
export default async function SiteHeader() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = (await getCategories()).slice(0, 14);
  } catch {
    // Navigation is not worth a 500. Render the shell and carry on.
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="bg-brand text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-xs">
          <LiveClock />
          <div className="flex items-center gap-4">
            <a
              href="https://www.youtube.com/c/chardiklatimetvgroup"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-6 items-center gap-1.5 hover:text-accent-on-dark xs:flex"
            >
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-live" />
              ਲਾਈਵ ਟੀਵੀ
            </a>
            <SocialLinks
              size={14}
              className="hidden sm:flex"
              itemClassName="text-white/80 hover:text-accent-on-dark"
            />
            <Link
              href="/search"
              prefetch={false}
              className="inline-flex min-h-6 min-w-6 items-center justify-center hover:text-accent-on-dark"
            >
              ਖੋਜ
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="shrink-0" aria-label="Chardikla Time TV — ਮੁੱਖ ਪੰਨਾ">
          <Image
            src="/logo.png"
            alt="Chardikla Time TV"
            width={272}
            height={90}
            priority
            quality={95}
            sizes="(max-width: 640px) 136px, 164px"
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <HeaderNav categories={categories} />
      </div>
    </header>
  );
}
