"use client";

import { useState } from "react";

/**
 * WhatsApp first, deliberately. For a Punjabi news audience it carries far
 * more sharing than any other channel.
 */
/**
 * Platform colours are darkened to the minimum that clears WCAG AA with white
 * text: WhatsApp green at #25D366 is only 1.98:1, which is unreadable for a
 * large share of readers.
 */
export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const enc = encodeURIComponent;
  const links = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${enc(`${title} ${url}`)}`,
      className: "bg-[#0f7a6c] hover:bg-[#0c6659]",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      className: "bg-[#1465d8] hover:bg-[#0d5ab5]",
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`,
      className: "bg-black hover:bg-neutral-800",
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`,
      className: "bg-[#0077b5] hover:bg-[#006699]",
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <span className="me-1 text-sm font-semibold text-ink-soft">ਸਾਂਝਾ ਕਰੋ:</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors ${l.className}`}
        >
          {l.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-brand-ink hover:text-brand-ink"
      >
        {copied ? "ਕਾਪੀ ਹੋ ਗਿਆ" : "ਲਿੰਕ ਕਾਪੀ ਕਰੋ"}
      </button>
    </div>
  );
}
