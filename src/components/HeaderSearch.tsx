"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

interface Suggestion {
  id: number;
  title: string;
  path: string;
  category: string | null;
}

/**
 * Search lives in the masthead as a real input, not a link to a separate page.
 *
 * On a news site search is a primary action: making someone load a whole page
 * before they can type costs a navigation and loses the intent. This submits
 * to /search for the full results page, but offers type-ahead first so most
 * searches end in one click.
 */
export default function HeaderSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Debounced lookup. setState lives inside the timer, never in the effect
  // body, so typing does not trigger a cascade of renders.
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) return;

    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      fetch(`/api/suggest/?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: { items?: Suggestion[] }) => {
          if (cancelled) return;
          setItems(d.items ?? []);
          setOpen(true);
          setActive(-1);
        })
        .catch(() => !cancelled && setItems([]))
        .finally(() => !cancelled && setLoading(false));
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [value]);

  // Close when focus or a click leaves the widget.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const submit = (q: string) => {
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/search/?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      setOpen(false);
      router.push(items[active].path);
    }
  };

  return (
    <div ref={boxRef} className={`relative ${compact ? "w-full" : "w-full max-w-md"}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <label htmlFor={`${listId}-input`} className="sr-only">
          ਖ਼ਬਰ ਲੱਭੋ
        </label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-ink-faint"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            id={`${listId}-input`}
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => items.length > 0 && setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="ਖ਼ਬਰ ਲੱਭੋ…"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            className="h-10 w-full rounded-full border border-line bg-surface-soft ps-10 pe-10 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-brand-ink focus:bg-surface"
          />
          {loading && (
            <span
              aria-hidden="true"
              className="absolute inset-y-0 end-0 flex items-center pe-3.5"
            >
              <span className="size-3.5 animate-spin rounded-full border-2 border-line border-t-brand-ink" />
            </span>
          )}
          {!loading && value && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setItems([]);
                setOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="ਸਾਫ਼ ਕਰੋ"
              className="absolute inset-y-0 end-0 flex items-center pe-3 text-ink-faint hover:text-ink"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {open && (items.length > 0 || (!loading && value.trim().length >= 2)) && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
        >
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-soft">ਕੋਈ ਨਤੀਜਾ ਨਹੀਂ ਮਿਲਿਆ।</p>
          ) : (
            <>
              <ul className="max-h-[60vh] overflow-y-auto">
                {items.map((s, i) => (
                  <li key={s.id}>
                    <Link
                      href={s.path}
                      role="option"
                      aria-selected={i === active}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setActive(i)}
                      className={`block border-b border-line px-4 py-2.5 last:border-0 ${
                        i === active ? "bg-surface-soft" : ""
                      }`}
                    >
                      <span className="clamp-2 block text-sm font-medium leading-snug text-ink">
                        {s.title}
                      </span>
                      {s.category && (
                        <span className="mt-0.5 block text-xs text-ink-faint">{s.category}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => submit(value)}
                className="block w-full border-t border-line bg-surface-soft px-4 py-2.5 text-start text-xs font-semibold text-brand-ink hover:bg-surface"
              >
                “{value.trim()}” ਲਈ ਸਾਰੇ ਨਤੀਜੇ ਵੇਖੋ →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
