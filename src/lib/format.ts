/**
 * Punjabi date formatting.
 *
 * We deliberately do NOT rely on Intl's `pa` locale data. Chromium ships
 * without it and falls back to root, rendering "M10 4, Sun" instead of
 * "4 ਅਕਤੂਬਰ". Node happens to carry the data, so server-rendered dates look
 * fine while anything rendered in the browser breaks — and the audience here
 * is largely on low-end Android, where trimmed ICU builds are common.
 *
 * Timezone handling still goes through Intl, because `en-GB` data is always
 * present and `Asia/Kolkata` resolution is independent of locale data.
 */

const MONTHS = [
  "ਜਨਵਰੀ",
  "ਫ਼ਰਵਰੀ",
  "ਮਾਰਚ",
  "ਅਪ੍ਰੈਲ",
  "ਮਈ",
  "ਜੂਨ",
  "ਜੁਲਾਈ",
  "ਅਗਸਤ",
  "ਸਤੰਬਰ",
  "ਅਕਤੂਬਰ",
  "ਨਵੰਬਰ",
  "ਦਸੰਬਰ",
] as const;

const WEEKDAYS: Record<string, string> = {
  Sun: "ਐਤਵਾਰ",
  Mon: "ਸੋਮਵਾਰ",
  Tue: "ਮੰਗਲਵਾਰ",
  Wed: "ਬੁੱਧਵਾਰ",
  Thu: "ਵੀਰਵਾਰ",
  Fri: "ਸ਼ੁੱਕਰਵਾਰ",
  Sat: "ਸ਼ਨੀਚਰਵਾਰ",
};

const IST = "Asia/Kolkata";

interface Parts {
  day: string;
  monthIndex: number;
  year: string;
  weekday: string;
  hour: string;
  minute: string;
  dayPeriod: string;
}

function istParts(d: Date): Parts | null {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: IST,
      weekday: "short",
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).formatToParts(d);

    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return {
      // en-GB pads the day when combined with time fields; we want "4", not "04".
      day: get("day").replace(/^0/, ""),
      monthIndex: Number(get("month")) - 1,
      year: get("year"),
      weekday: get("weekday"),
      hour: get("hour"),
      minute: get("minute"),
      dayPeriod: get("dayPeriod").toUpperCase(),
    };
  } catch {
    return null;
  }
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = istParts(d);
  if (!p) return d.toISOString().slice(0, 10);
  return `${p.day} ${MONTHS[p.monthIndex] ?? ""} ${p.year}`.trim();
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = istParts(d);
  if (!p || !p.hour) return "";
  // AM/PM is widely understood here and shorter than the Gurmukhi equivalent.
  return `${p.hour}:${p.minute} ${p.dayPeriod}`;
}

/** "ਐਤਵਾਰ, 4 ਅਕਤੂਬਰ" — used by the masthead clock. */
export function formatDayLine(d: Date = new Date()): string {
  const p = istParts(d);
  if (!p) return "";
  const weekday = WEEKDAYS[p.weekday] ?? "";
  return `${weekday}, ${p.day} ${MONTHS[p.monthIndex] ?? ""}`.replace(/^, /, "");
}

export function timeAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "ਹੁਣੇ";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} ਮਿੰਟ ਪਹਿਲਾਂ`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ਘੰਟੇ ਪਹਿਲਾਂ`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ਦਿਨ ਪਹਿਲਾਂ`;

  return formatDate(iso);
}

export function isRecent(iso: string, hours = 48): boolean {
  const d = new Date(iso).getTime();
  return !Number.isNaN(d) && Date.now() - d < hours * 3_600_000;
}

export function smartStamp(iso: string): string {
  return isRecent(iso) ? timeAgo(iso) : formatDate(iso);
}

export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** Rough reading time. Gurmukhi runs denser than Latin, so we count characters. */
export function readingTime(html: string): number {
  const chars = html.replace(/<[^>]*>/g, "").length;
  return Math.max(1, Math.round(chars / 900));
}
