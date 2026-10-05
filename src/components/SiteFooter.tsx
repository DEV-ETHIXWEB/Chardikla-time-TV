import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/wp";
import { SITE_NAME } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/site";
import SocialLinks from "./SocialLinks";

export default async function SiteFooter() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = (await getCategories()).slice(0, 12);
  } catch {
    /* footer navigation is optional */
  }

  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line bg-surface-soft">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_2fr]">
          <div>
            <Image
              src="/logo.png"
              alt={SITE_NAME}
              width={272}
              height={90}
              quality={95}
              sizes="152px"
              className="h-11 w-auto"
            />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
              ਚੜ੍ਹਦੀਕਲਾ ਟਾਈਮ ਟੀਵੀ ਦਾ ਮੁੱਖ ਉਦੇਸ਼ ਖ਼ਬਰਾਂ ਅਤੇ ਮਨੋਰੰਜਨ ਰਾਹੀਂ ਅਸਲ ਤਸਵੀਰ
              ਪੇਸ਼ ਕਰਨਾ ਹੈ।
            </p>
            <p className="mt-3 text-sm text-ink-soft">
              ਸੰਪਰਕ:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-brand-ink hover:text-accent-ink"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <div className="mt-4">
              <h2 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-ink">
                ਸਾਨੂੰ ਫਾਲੋ ਕਰੋ
              </h2>
              <SocialLinks
                size={18}
                itemClassName="bg-surface text-ink-soft ring-1 ring-line hover:bg-brand hover:text-white hover:ring-brand-ink"
              />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink">
              ਸ਼੍ਰੇਣੀਆਂ
            </h2>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={c.path}
                    className="inline-flex min-h-6 min-w-6 items-center text-sm text-ink-soft hover:text-brand-ink"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE_NAME}. ਸਾਰੇ ਹੱਕ ਰਾਖਵੇਂ ਹਨ।
          </p>
          <nav aria-label="ਨੀਤੀਆਂ" className="flex flex-wrap gap-4">
            <Link href="/archive/" className="inline-flex min-h-6 min-w-6 items-center hover:text-brand-ink">
              ਪੁਰਾਣੀਆਂ ਖ਼ਬਰਾਂ
            </Link>
            <Link href="/about" className="inline-flex min-h-6 min-w-6 items-center hover:text-brand-ink">
              ਸਾਡੇ ਬਾਰੇ
            </Link>
            <Link href="/contact" className="inline-flex min-h-6 min-w-6 items-center hover:text-brand-ink">
              ਸੰਪਰਕ
            </Link>
            <Link href="/privacy-policy" className="inline-flex min-h-6 min-w-6 items-center hover:text-brand-ink">
              ਪਰਾਈਵੇਸੀ ਪਾਲਿਸੀ
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
