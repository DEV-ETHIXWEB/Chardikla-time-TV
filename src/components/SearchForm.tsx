"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
      }}
      className="flex gap-2"
    >
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ਖ਼ਬਰ ਲੱਭੋ…"
        aria-label="ਖ਼ਬਰ ਲੱਭੋ"
        className="min-w-0 flex-1 rounded-md border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-ink"
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
      >
        ਖੋਜੋ
      </button>
    </form>
  );
}
