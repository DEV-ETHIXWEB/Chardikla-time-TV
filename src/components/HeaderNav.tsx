"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Term } from "@/lib/types";

export default function HeaderNav({ categories }: { categories: Term[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // The drawer closes from the link's own click rather than from an effect on
  // pathname: reacting to navigation means a second render pass every time.
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (path: string) =>
    pathname === path || pathname === path.replace(/\/$/, "");

  return (
    <>
      {/* Desktop: a single scrolling rail. Punjabi category names are long, so
          they get horizontal scroll rather than wrapping into two rows. */}
      <nav
        aria-label="ਸ਼੍ਰੇਣੀਆਂ"
        className="no-scrollbar hidden flex-1 overflow-x-auto lg:block"
      >
        <ul className="flex items-center gap-1 whitespace-nowrap">
          <li>
            <Link
              href="/"
              className={`rounded px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-soft ${
                pathname === "/" ? "text-accent-ink" : "text-ink"
              }`}
            >
              ਮੁੱਖ ਪੰਨਾ
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={c.path}
                className={`rounded px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-soft ${
                  isActive(c.path) ? "text-accent-ink" : "text-ink"
                }`}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="ms-auto flex items-center gap-1 lg:ms-0">
        <Link
          href="/search"
          prefetch={false}
          aria-label="ਖੋਜ ਕਰੋ"
          className="rounded-md p-2 text-ink transition-colors hover:bg-surface-soft"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "ਮੀਨੂ ਬੰਦ ਕਰੋ" : "ਮੀਨੂ ਖੋਲ੍ਹੋ"}
          className="rounded-md p-2 text-ink transition-colors hover:bg-surface-soft lg:hidden"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? (
              <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </>
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

      {open && (
        <div
          className="absolute inset-x-0 top-full z-40 h-dvh bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-nav"
        hidden={!open}
        className="absolute inset-x-0 top-full z-50 max-h-[70dvh] overflow-y-auto border-b border-line bg-surface shadow-xl lg:hidden"
      >
        <nav aria-label="ਸ਼੍ਰੇਣੀਆਂ">
          <ul className="grid grid-cols-2 gap-px bg-line p-px">
            <li className="col-span-2">
              <Link
                href="/"
                onClick={close}
                className="block bg-surface px-4 py-3 font-semibold text-ink"
              >
                ਮੁੱਖ ਪੰਨਾ
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={c.path}
                  onClick={close}
                  className={`flex items-center justify-between gap-2 bg-surface px-4 py-3 text-sm font-medium ${
                    isActive(c.path) ? "text-accent-ink" : "text-ink"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 text-xs text-ink-faint">
                    {c.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
