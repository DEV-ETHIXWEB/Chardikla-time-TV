"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminBar({ user }: { user: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    await fetch("/api/admin/logout/", { method: "POST" }).catch(() => {});
    router.push("/admin/login/");
    router.refresh();
  };

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1100px] items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/admin/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Chardikla Time TV"
            width={272}
            height={90}
            quality={95}
            sizes="130px"
            className="h-8 w-auto"
          />
          <span className="text-sm font-bold text-ink">ਐਡਮਿਨ ਪੋਰਟਲ</span>
        </Link>

        <div className="ms-auto flex items-center gap-3 text-sm">
          <Link href="/" className="hidden text-ink-soft hover:text-brand-ink sm:inline">
            ਵੈੱਬਸਾਈਟ ਵੇਖੋ ↗
          </Link>
          <span className="hidden text-ink-faint sm:inline">{user}</span>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink transition-colors hover:border-brand-ink hover:text-brand-ink disabled:opacity-60"
          >
            {busy ? "…" : "ਲੌਗ ਆਊਟ"}
          </button>
        </div>
      </div>
    </header>
  );
}
