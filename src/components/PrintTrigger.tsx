"use client";

import { useEffect, useRef } from "react";

/**
 * Opens the browser's print dialog once the page has settled.
 *
 * "Save as PDF" in that dialog is how this site produces PDFs. It is not a
 * shortcut: PDF libraries that run on the server could not shape Gurmukhi at
 * all — pdfkit/fontkit throws on Noto Sans Gurmukhi's positioning tables, so
 * the text would have come out as broken or missing glyphs. The browser uses
 * HarfBuzz, the same engine that renders the site, so the PDF matches what the
 * reader sees, including every matra.
 */
export default function PrintTrigger({ auto = false }: { auto?: boolean }) {
  const fired = useRef(false);

  useEffect(() => {
    if (!auto || fired.current) return;
    fired.current = true;
    // Wait for fonts, otherwise the dialog can open mid-swap.
    const go = () => window.setTimeout(() => window.print(), 350);
    if (document.fonts?.ready) {
      document.fonts.ready.then(go).catch(go);
    } else {
      go();
    }
  }, [auto]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 print:hidden"
    >
      ⬇ PDF ਸੇਵ ਕਰੋ / ਪ੍ਰਿੰਟ ਕਰੋ
    </button>
  );
}
