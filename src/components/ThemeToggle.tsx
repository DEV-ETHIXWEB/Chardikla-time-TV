"use client";

import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "ctv-theme";

/**
 * Light / dark / follow-system.
 *
 * The chosen theme is applied by an inline script in the document head before
 * first paint (see layout.tsx). Doing it here instead would show the wrong
 * colours for a frame on every load — the "flash of white" that makes a dark
 * theme feel broken.
 */
/** Listeners for same-tab changes; `storage` only fires in *other* tabs. */
const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "dark" || v === "light" ? v : "system";
  } catch {
    // Private browsing can throw on access; follow the system instead.
    return "system";
  }
}

/** The server has no preference to read, so it always renders "system". */
const getServerSnapshot = (): Theme => "system";

export default function ThemeToggle() {
  // Reading browser state through useSyncExternalStore avoids setting state
  // inside an effect, which would cost an extra render on every mount.
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const apply = useCallback((next: Theme) => {
    const root = document.documentElement;
    if (next === "system") {
      root.removeAttribute("data-theme");
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    } else {
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
    }
    emit();
  }, []);

  const options: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    {
      value: "light",
      label: "ਦਿਨ",
      icon: (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      ),
    },
    {
      value: "dark",
      label: "ਰਾਤ",
      icon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
    },
    {
      value: "system",
      label: "ਆਟੋ",
      icon: (
        <>
          <rect x="2" y="4" width="20" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </>
      ),
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="ਥੀਮ ਚੁਣੋ"
      className="inline-flex items-center gap-0.5 rounded-full bg-white/10 p-0.5"
    >
      {options.map((o) => {
        const selected = theme === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={o.label}
            title={o.label}
            onClick={() => apply(o.value)}
            className={`inline-flex size-6 items-center justify-center rounded-full transition-colors ${
              selected
                ? "bg-white text-brand"
                : "text-white/75 hover:text-white"
            }`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {o.icon}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
