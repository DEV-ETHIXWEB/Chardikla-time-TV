import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "ਸਾਡੇ ਬਾਰੇ",
  description: `${SITE_NAME} ਬਾਰੇ ਜਾਣਕਾਰੀ।`,
  alternates: { canonical: `${SITE_URL}/about/` },
};

/** Copy taken from the live site's own About block, not written by us. */
export default function AboutPage() {
  return (
    <PageShell title="ਸਾਡੇ ਬਾਰੇ">
      <p>
        ਚੜ੍ਹਦੀਕਲਾ ਟਾਈਮ ਟੀਵੀ ਦਾ ਮੁੱਖ ਉਦੇਸ਼ ਖ਼ਬਰਾਂ ਅਤੇ ਮਨੋਰੰਜਨ ਰਾਹੀਂ ਅਸਲ ਤਸਵੀਰ ਪੇਸ਼
        ਕਰਨਾ ਹੈ। ਇਹ ਪੂਰੇ ਦੇਸ਼ ਵਿੱਚ ਤਾਜ਼ਾ ਘਟਨਾਵਾਂ ਨੂੰ ਕਵਰ ਕਰਦਾ ਹੈ, ਜਿਸ ਵਿੱਚ ਪੰਜਾਬ,
        ਹਰਿਆਣਾ, ਦਿੱਲੀ, ਹਿਮਾਚਲ ਪ੍ਰਦੇਸ਼, ਜੰਮੂ ਅਤੇ ਕਸ਼ਮੀਰ, ਰਾਜਸਥਾਨ, ਉੱਤਰ ਪ੍ਰਦੇਸ਼,
        ਉਤਰਾਖੰਡ, ਝਾਰਖੰਡ, ਬਿਹਾਰ, ਮਹਾਰਾਸ਼ਟਰ ਅਤੇ ਮੱਧ ਪ੍ਰਦੇਸ਼ ਆਦਿ ’ਤੇ ਵਿਸ਼ੇਸ਼ ਧਿਆਨ ਦਿੱਤਾ
        ਜਾਂਦਾ ਹੈ।
      </p>
      <p>
        ਚੜ੍ਹਦੀਕਲਾ ਟਾਈਮ ਟੀਵੀ ਨੇ ਪੂਰੇ ਭਾਰਤ ਵਿੱਚ ਰਿਪੋਰਟਰਾਂ ਦਾ ਇੱਕ ਬਹੁਤ ਮਜ਼ਬੂਤ ਨੈੱਟਵਰਕ
        ਬਣਾਇਆ ਹੈ।
      </p>
      <p>
        ਸੰਪਰਕ: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </PageShell>
  );
}
