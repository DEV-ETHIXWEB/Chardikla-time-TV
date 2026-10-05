/**
 * A 1x1 neutral placeholder, inlined so there is no extra request.
 *
 * Next's `blur` placeholder needs a base64 source for remote images. Generating
 * a real LQIP per image would mean decoding 14,191 files, so a flat tone that
 * matches the surface colour does the job: it holds the layout and removes the
 * white flash while the photo decodes.
 */
export const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjUiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjUiIGZpbGw9IiNlOGVhZWUiLz48L3N2Zz4=";

/**
 * Photos on this site are 500-1280px originals. Asking the optimiser for more
 * than the source has only wastes a cache entry, so each slot declares the
 * narrowest `sizes` that still covers its largest rendered width.
 */
export const SIZES = {
  hero: "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 700px",
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px",
  rail: "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 230px",
  thumb: "112px",
  article: "(max-width: 1024px) 100vw, 760px",
} as const;

/** Re-encoding an already-compressed news photo at 75 reads as blur. */
export const IMG_QUALITY = 90;
