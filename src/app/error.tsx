"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaces in the platform logs; swap for a real reporter when one exists.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-ink">ਕੁਝ ਗੜਬੜ ਹੋ ਗਈ</h1>
      <p className="mt-3 text-ink-soft">
        ਖ਼ਬਰਾਂ ਲੋਡ ਕਰਨ ਵਿੱਚ ਦਿੱਕਤ ਆਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ
      </button>
    </div>
  );
}
