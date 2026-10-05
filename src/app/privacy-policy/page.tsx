import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "ਪਰਾਈਵੇਸੀ ਪਾਲਿਸੀ",
  description: `${SITE_NAME} ਦੀ ਪਰਾਈਵੇਸੀ ਪਾਲਿਸੀ।`,
  alternates: { canonical: `${SITE_URL}/privacy-policy/` },
};

/**
 * Placeholder. This page is a hard requirement for AdSense and for Google's
 * publisher policies, and the live site currently has none.
 * TODO(client): have this reviewed before launch.
 */
export default function PrivacyPolicyPage() {
  return (
    <PageShell title="ਪਰਾਈਵੇਸੀ ਪਾਲਿਸੀ">
      <p>
        ਇਹ ਪੰਨਾ ਦੱਸਦਾ ਹੈ ਕਿ {SITE_NAME} ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਕਿਵੇਂ ਇਕੱਠੀ ਅਤੇ ਵਰਤੋਂ ਕਰਦਾ ਹੈ।
      </p>
      <h2>ਜਾਣਕਾਰੀ ਜੋ ਅਸੀਂ ਇਕੱਠੀ ਕਰਦੇ ਹਾਂ</h2>
      <p>
        ਅਸੀਂ ਵੈੱਬਸਾਈਟ ਦੀ ਵਰਤੋਂ ਸਮਝਣ ਲਈ ਐਨਾਲਿਟਿਕਸ ਸੇਵਾਵਾਂ ਵਰਤਦੇ ਹਾਂ। ਇਹਨਾਂ ਵਿੱਚ ਤੁਹਾਡਾ
        ਬਰਾਊਜ਼ਰ, ਡਿਵਾਈਸ ਅਤੇ ਵੇਖੇ ਗਏ ਪੰਨਿਆਂ ਦੀ ਜਾਣਕਾਰੀ ਸ਼ਾਮਲ ਹੋ ਸਕਦੀ ਹੈ।
      </p>
      <h2>ਕੂਕੀਜ਼</h2>
      <p>
        ਸਾਡੀ ਵੈੱਬਸਾਈਟ ਕੂਕੀਜ਼ ਵਰਤ ਸਕਦੀ ਹੈ। ਤੁਸੀਂ ਆਪਣੇ ਬਰਾਊਜ਼ਰ ਦੀਆਂ ਸੈਟਿੰਗਾਂ ਤੋਂ ਇਹਨਾਂ ਨੂੰ
        ਬੰਦ ਕਰ ਸਕਦੇ ਹੋ।
      </p>
      <h2>ਸੰਪਰਕ</h2>
      <p>
        ਕਿਸੇ ਵੀ ਸਵਾਲ ਲਈ{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ਉੱਤੇ ਲਿਖੋ।
      </p>
    </PageShell>
  );
}
