"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Term } from "@/lib/types";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
}

/** Must match MAX_POSTS in /api/export. */
const MAX_EXPORT = 5000;

const PRESETS = [
  { label: "ਪਿਛਲੇ 7 ਦਿਨ", days: 7 },
  { label: "ਪਿਛਲੇ 30 ਦਿਨ", days: 30 },
  { label: "ਪਿਛਲੇ 60 ਦਿਨ", days: 60 },
  { label: "ਪਿਛਲੇ 90 ਦਿਨ", days: 90 },
  { label: "ਪਿਛਲਾ 1 ਸਾਲ", days: 365 },
];

export default function ArchiveFilters({
  categories,
  from,
  to,
  category,
}: {
  categories: Term[];
  from: string;
  to: string;
  category: string;
}) {
  const router = useRouter();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const [c, setC] = useState(category);
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);

  const today = iso(new Date());
  const invalid = !f || !t || f > t;

  const query = new URLSearchParams({ from: f, to: t });
  if (c) query.set("category", c);
  const params = query.toString();

  // Show how many articles the range holds before anyone starts a download
  // that could run to thousands of rows.
  useEffect(() => {
    // No setState for the invalid case: the render below checks `invalid`
    // first, so a stale count can never reach the screen anyway.
    if (invalid) return;

    let cancelled = false;
    // setCounting lives inside the timeout, not the effect body: a synchronous
    // setState here would trigger a second render on every keystroke.
    const id = setTimeout(() => {
      if (cancelled) return;
      setCounting(true);
      fetch(`/api/export/?${params}`, { method: "HEAD" })
        .then((r) => {
          if (cancelled) return;
          const n = r.headers.get("X-Total-Posts");
          setCount(n ? Number(n) : null);
        })
        .catch(() => !cancelled && setCount(null))
        .finally(() => !cancelled && setCounting(false));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [params, invalid]);

  const apply = () => {
    if (invalid) return;
    router.push(`/archive/?${params}`);
  };

  const field =
    "rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-ink";

  return (
    <div className="rounded-xl border border-line bg-surface-soft/60 p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => {
              setF(daysAgo(p.days));
              setT(today);
            }}
            className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-brand-ink hover:text-brand-ink"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-ink-soft">ਇਸ ਤਾਰੀਖ਼ ਤੋਂ</span>
          <input
            type="date"
            value={f}
            max={today}
            onChange={(e) => setF(e.target.value)}
            className={field}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-ink-soft">ਇਸ ਤਾਰੀਖ਼ ਤੱਕ</span>
          <input
            type="date"
            value={t}
            max={today}
            onChange={(e) => setT(e.target.value)}
            className={field}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-ink-soft">ਸ਼੍ਰੇਣੀ</span>
          <select
            value={c}
            onChange={(e) => setC(e.target.value)}
            className={field}
          >
            <option value="">ਸਾਰੀਆਂ ਸ਼੍ਰੇਣੀਆਂ</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-1.5">
          <span className="text-xs font-semibold text-ink-soft">&nbsp;</span>
          <button
            type="button"
            onClick={apply}
            disabled={invalid}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ਖ਼ਬਰਾਂ ਵੇਖੋ
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <div className="text-sm text-ink-soft">
          <span>
            {invalid
              ? "ਸਹੀ ਤਾਰੀਖ਼ ਚੁਣੋ"
              : counting
                ? "ਗਿਣਤੀ ਹੋ ਰਹੀ ਹੈ…"
                : count === null
                  ? "\u00a0"
                  : `ਇਸ ਸਮੇਂ ਵਿੱਚ ${count.toLocaleString("en-IN")} ਖ਼ਬਰਾਂ`}
          </span>
          {/* A download must never truncate silently. */}
          {!invalid && count !== null && count > MAX_EXPORT && (
            <p className="mt-1 max-w-md text-xs leading-relaxed text-live-ink">
              ਇੱਕ ਵਾਰ ਵਿੱਚ ਸਿਰਫ਼ {MAX_EXPORT.toLocaleString("en-IN")} ਖ਼ਬਰਾਂ ਡਾਊਨਲੋਡ
              ਹੋਣਗੀਆਂ (ਨਵੀਆਂ ਤੋਂ ਸ਼ੁਰੂ)। ਪੂਰਾ ਡਾਟਾ ਲੈਣ ਲਈ ਛੋਟੇ ਸਮੇਂ ਚੁਣ ਕੇ ਕੁਝ ਵਾਰ
              ਡਾਊਨਲੋਡ ਕਰੋ।
            </p>
          )}
        </div>

        <div className="ms-auto flex flex-wrap gap-2">
          <a
            href={`/api/export/?${params}&format=csv`}
            className={`rounded-lg bg-accent-chip px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-600 ${
              invalid ? "pointer-events-none opacity-50" : ""
            }`}
          >
            ⬇ CSV (Excel)
          </a>
          <a
            href={`/api/export/?${params}&format=csv&content=1`}
            className={`rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-ink hover:text-brand-ink ${
              invalid ? "pointer-events-none opacity-50" : ""
            }`}
          >
            ⬇ CSV + ਪੂਰੀ ਖ਼ਬਰ
          </a>
          <a
            href={`/archive/print/?${params}&auto=1`}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-ink hover:text-brand-ink ${
              invalid ? "pointer-events-none opacity-50" : ""
            }`}
          >
            ⬇ PDF
          </a>
          <a
            href={`/archive/print/?${params}&full=1&auto=1`}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-ink hover:text-brand-ink ${
              invalid ? "pointer-events-none opacity-50" : ""
            }`}
          >
            ⬇ PDF + ਪੂਰੀ ਖ਼ਬਰ
          </a>
          <a
            href={`/api/export/?${params}&format=json`}
            className={`rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand-ink hover:text-brand-ink ${
              invalid ? "pointer-events-none opacity-50" : ""
            }`}
          >
            ⬇ JSON
          </a>
        </div>
      </div>
    </div>
  );
}
