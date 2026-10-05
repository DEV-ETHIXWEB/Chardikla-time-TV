import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/site";
import SocialLinks from "@/components/SocialLinks";

export const metadata: Metadata = {
  title: "ਸੰਪਰਕ",
  description: `${SITE_NAME} ਨਾਲ ਸੰਪਰਕ ਕਰੋ।`,
  alternates: { canonical: `${SITE_URL}/contact/` },
};

/* Email verified from the live site. TODO(client): postal address and phone. */
export default function ContactPage() {
  return (
    <PageShell title="ਸੰਪਰਕ ਕਰੋ">
      <p>ਖ਼ਬਰ, ਸੁਝਾਅ ਜਾਂ ਇਸ਼ਤਿਹਾਰ ਲਈ ਸਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।</p>
      <table>
        <tbody>
          <tr>
            <th scope="row">ਈਮੇਲ</th>
            <td>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </td>
          </tr>
          <tr>
            <th scope="row">ਨਿਊਜ਼ਰੂਮ</th>
            <td>—</td>
          </tr>
          <tr>
            <th scope="row">ਪਤਾ</th>
            <td>—</td>
          </tr>
        </tbody>
      </table>
      <h2>ਸਾਨੂੰ ਫਾਲੋ ਕਰੋ</h2>
      <SocialLinks
        size={20}
        itemClassName="bg-surface-soft text-ink-soft ring-1 ring-line hover:bg-brand hover:text-white"
      />
    </PageShell>
  );
}
