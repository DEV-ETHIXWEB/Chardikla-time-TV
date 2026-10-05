import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminBar from "@/components/admin/AdminBar";
import ArchiveFilters from "@/components/ArchiveFilters";
import { SESSION_COOKIE, readSession } from "@/lib/auth";
import { getCategories } from "@/lib/wp";

export const metadata: Metadata = {
  title: "ਐਡਮਿਨ ਪੋਰਟਲ",
  robots: { index: false, follow: false },
};

/** Always render per-request: this page is behind a session. */
export const dynamic = "force-dynamic";

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default async function AdminPage() {
  // proxy.ts already blocks anonymous requests; this is the second lock, so a
  // routing mistake cannot quietly expose the portal.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await readSession(token, process.env.AUTH_SECRET ?? "");
  if (!session) redirect("/admin/login/");

  const categories = await getCategories().catch(() => []);

  return (
    <div className="admin-view min-h-dvh bg-surface-soft">
      <AdminBar user={session.user} />

      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-ink">ਖ਼ਬਰਾਂ ਡਾਊਨਲੋਡ ਕਰੋ</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
          ਤਾਰੀਖ਼ ਚੁਣੋ ਅਤੇ ਉਸ ਸਮੇਂ ਦੀਆਂ ਖ਼ਬਰਾਂ Excel (CSV), PDF ਜਾਂ JSON ਵਿੱਚ
          ਡਾਊਨਲੋਡ ਕਰੋ। ਇੱਕ ਵਾਰ ਵਿੱਚ ਵੱਧ ਤੋਂ ਵੱਧ 5,000 ਖ਼ਬਰਾਂ।
        </p>

        <div className="mt-6">
          <ArchiveFilters
            categories={categories}
            from={isoDaysAgo(60)}
            to={new Date().toISOString().slice(0, 10)}
            category=""
          />
        </div>

        <section className="mt-8 rounded-xl border border-line bg-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
            ਫਾਰਮੈਟ
          </h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-ink">CSV (Excel)</dt>
              <dd className="text-sm text-ink-soft">
                ਤਾਰੀਖ਼, ਸਿਰਲੇਖ, ਸ਼੍ਰੇਣੀ, ਟੈਗ, ਲੇਖਕ, ਲਿੰਕ, ਸਾਰ। Excel ਵਿੱਚ ਪੰਜਾਬੀ
                ਠੀਕ ਖੁੱਲ੍ਹਦੀ ਹੈ।
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-ink">PDF</dt>
              <dd className="text-sm text-ink-soft">
                ਛਾਪਣ ਲਈ ਤਿਆਰ ਦਸਤਾਵੇਜ਼। ਪ੍ਰਿੰਟ ਵਿੰਡੋ ਵਿੱਚ “Save as PDF” ਚੁਣੋ।
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-ink">JSON</dt>
              <dd className="text-sm text-ink-soft">
                ਕਿਸੇ ਹੋਰ ਸਿਸਟਮ ਵਿੱਚ ਵਰਤਣ ਲਈ।
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-ink">ਪੂਰੀ ਖ਼ਬਰ</dt>
              <dd className="text-sm text-ink-soft">
                “ਪੂਰੀ ਖ਼ਬਰ” ਵਾਲੇ ਬਟਨ ਖ਼ਬਰ ਦਾ ਪੂਰਾ ਟੈਕਸਟ ਵੀ ਸ਼ਾਮਲ ਕਰਦੇ ਹਨ।
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
