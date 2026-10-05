import sanitizeHtml from "sanitize-html";

const WP_URL = process.env.WP_URL ?? "https://timetv.news";

/**
 * Prepare WordPress article HTML for rendering on our own front end.
 *
 * The body goes through `dangerouslySetInnerHTML`, so it is sanitised with a
 * real parser rather than regexes. The source is the client's own WordPress,
 * but a single compromised editor account would otherwise mean stored XSS on
 * every reader's browser, and regex stripping has a long history of being
 * walked around with nested or malformed tags.
 *
 * Allow-list, not block-list: anything not named here is dropped.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "span", "div",
    "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
    "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "blockquote", "q", "cite", "pre", "code",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    "iframe",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
    iframe: ["src", "width", "height", "allow", "allowfullscreen", "title", "loading"],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  // Embeds are limited to hosts the newsroom actually uses. Anything else
  // would let a post frame arbitrary third-party content.
  allowedIframeHostnames: [
    "www.youtube.com", "youtube.com", "www.youtube-nocookie.com",
    "player.vimeo.com",
    "www.facebook.com",
    "platform.twitter.com",
    "www.dailymotion.com",
  ],
  // Inline styles are how the old theme justified every paragraph; we drop
  // them entirely and let the stylesheet decide.
  allowedStyles: {},
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      // Internal links become relative so navigation stays client-side and
      // never bounces a reader back to the old WordPress front end.
      if (href.startsWith(WP_URL)) {
        return {
          tagName,
          attribs: { ...attribs, href: href.slice(WP_URL.length) || "/" },
        };
      }
      if (/^https?:\/\//i.test(href)) {
        return {
          tagName,
          attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" },
        };
      }
      return { tagName, attribs };
    },
    img: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        loading: attribs.loading ?? "lazy",
        decoding: attribs.decoding ?? "async",
        alt: attribs.alt ?? "",
      },
    }),
  },
};

export function prepareContent(html: string): string {
  if (!html) return "";

  let out = sanitizeHtml(html, OPTIONS);

  // A blocked iframe host leaves <iframe></iframe> with no src; drop the
  // shell rather than wrapping an empty box in the article.
  out = out.replace(/<iframe(?![^>]*\ssrc=)[^>]*>\s*<\/iframe>/gi, "");

  // Responsive embeds, applied after sanitising so the wrapper survives.
  out = out.replace(
    /<iframe\b([^>]*)>\s*<\/iframe>/gi,
    (_m, attrs: string) => `<div class="embed-responsive"><iframe${attrs}></iframe></div>`,
  );

  // Collapse the empty paragraphs the editor leaves behind.
  out = out.replace(/<p>(\s|&nbsp;)*<\/p>/gi, "");

  return out.trim();
}
