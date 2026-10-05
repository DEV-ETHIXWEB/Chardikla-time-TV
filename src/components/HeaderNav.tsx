"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Term } from "@/lib/types";
import HeaderSearch from "./HeaderSearch";

export default function HeaderNav({ categories }: { categories: Term[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  // The drawer closes from the link's own click rather than from an effect on
  // pathname: reacting to navigation means a second render pass every time.
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (path: string) =>
    pathname === path || pathname === path.replace(/\/$/, "");

  const iconBtn =
    "inline-flex size-10 items-center justify-center rounded-lg text-ink transition-colors hover:bg-surface-soft";

  return (
    <>
      <div className="ms-auto flex items-center gap-1 md:ms-0">
        {/* Below md the field would crowd the logo, so it toggles open on its
            own row instead of navigating to a separate search page. */}
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          aria-expanded={searchOpen}
          aria-controls="header-search-panel"
          aria-label={searchOpen ? "ਖੋਜ ਬੰਦ ਕਰੋ" : "ਖੋਜ ਖੋਲ੍ਹੋ"}
          className={`${iconBtn} md:hidden`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {searchOpen ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </>
            )}
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "ਮੀਨੂ ਬੰਦ ਕਰੋ" : "ਮੀਨੂ ਖੋਲ੍ਹੋ"}
          className={`${iconBtn} lg:hidden`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {menuOpen ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <>
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile search panel, anchored to the masthead's bottom edge. */}
      <div
        id="header-search-panel"
        hidden={!searchOpen}
        className="absolute inset-x-0 top-full z-50 border-b border-line bg-surface px-4 py-3 shadow-lg md:hidden"
      >
        <HeaderSearch compact />
      </div>

      {menuOpen && (
        <div
          className="absolute inset-x-0 top-full z-40 h-dvh bg-black/40 lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-nav"
        hidden={!menuOpen}
        className="absolute inset-x-0 top-full z-50 max-h-[70dvh] overflow-y-auto border-b border-line bg-surface shadow-xl lg:hidden"
      >
        <nav aria-label="ਸ਼੍ਰੇਣੀਆਂ">
          <ul className="grid grid-cols-2 gap-px bg-line p-px">
            <li className="col-span-2">
              <Link
                href="/"
                onClick={closeMenu}
                className="block bg-surface px-4 py-3 font-semibold text-ink"
              >
                ਮੁੱਖ ਪੰਨਾ
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={c.path}
                  onClick={closeMenu}
                  className={`flex items-center justify-between gap-2 bg-surface px-4 py-3 text-sm font-medium ${
                    isActive(c.path) ? "text-accent-ink" : "text-ink"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 text-xs text-ink-faint">{c.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
