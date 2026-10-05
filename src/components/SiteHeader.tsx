import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/wp";
import HeaderNav from "./HeaderNav";
import HeaderSearch from "./HeaderSearch";
import LiveClock from "./LiveClock";
import SocialLinks from "./SocialLinks";

/**
 * Server component so the category list is in the HTML. The old site had no
 * usable menu endpoint (wp/v2/menus returns 401), so navigation comes from
 * categories ordered by volume — what the newsroom actually publishes.
 */
export default async function SiteHeader() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = (await getCategories()).slice(0, 14);
  } catch {
    // Navigation is not worth a 500. Render the shell and carry on.
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      {/* Utility bar */}
      <div className="bg-brand text-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-1.5 text-xs sm:px-6">
          <LiveClock />
          <div className="flex items-center gap-3">
            <a
              href="https://www.youtube.com/c/chardiklatimetvgroup"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden min-h-6 items-center gap-1.5 font-medium hover:text-accent-on-dark xs:flex"
            >
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-live" />
              ਲਾਈਵ ਟੀਵੀ
            </a>
            <SocialLinks
              size={14}
              className="hidden sm:flex"
              itemClassName="text-white/80 hover:text-accent-on-dark"
            />
          </div>
        </div>
      </div>

      {/* Masthead: logo, inline search, controls */}
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="shrink-0"
          aria-label="Chardikla Time TV — ਮੁੱਖ ਪੰਨਾ"
        >
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

        {/* Search sits in the masthead on anything tablet-width and up. */}
        <div className="ms-auto hidden min-w-0 flex-1 justify-end md:flex">
          <HeaderSearch />
        </div>

        <HeaderNav categories={categories} />
      </div>

      {/* Category rail on its own line — 14 Punjabi labels do not fit beside
          a logo and a search field without crowding all three. */}
      <nav
        aria-label="ਸ਼੍ਰੇਣੀਆਂ"
        className="no-scrollbar hidden overflow-x-auto border-t border-line bg-surface-soft/60 lg:block"
      >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <ul className="flex items-center gap-0.5 whitespace-nowrap">
            <li>
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:text-brand-ink"
              >
                ਮੁੱਖ ਪੰਨਾ
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={c.path}
                  className="inline-flex items-center px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:text-brand-ink"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
