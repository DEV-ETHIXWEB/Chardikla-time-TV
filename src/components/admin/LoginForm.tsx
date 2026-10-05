"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "ਲੌਗਇਨ ਨਹੀਂ ਹੋ ਸਕਿਆ।");
        setBusy(false);
        return;
      }
      // Only internal destinations: an open redirect here would let a crafted
      // link bounce someone off-site immediately after signing in.
      const next = params.get("next");
      const dest =
        next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin/";
      router.push(dest);
      router.refresh();
    } catch {
      setError("ਨੈੱਟਵਰਕ ਸਮੱਸਿਆ। ਮੁੜ ਕੋਸ਼ਿਸ਼ ਕਰੋ।");
      setBusy(false);
    }
  };

  const field =
    "h-11 w-full rounded-lg border border-line bg-surface px-3.5 text-sm text-ink outline-none focus:border-brand-ink";

  return (
    <form onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1.5">
        <span className="text-sm font-semibold text-ink">ਯੂਜ਼ਰਨੇਮ</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          className={field}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-sm font-semibold text-ink">ਪਾਸਵਰਡ</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className={field}
        />
      </label>

      {error && (
        <p role="alert" className="rounded-lg bg-live/10 px-3 py-2 text-sm text-live-ink">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="h-11 rounded-lg bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {busy ? "ਜਾਂਚ ਹੋ ਰਹੀ ਹੈ…" : "ਲੌਗਇਨ ਕਰੋ"}
      </button>
    </form>
  );
}
