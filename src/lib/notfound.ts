/**
 * `notFound()` works by throwing a sentinel error that Next catches upstream.
 * Any catch block that swallows errors must let that one through, or a genuine
 * 404 silently turns into a rendered page.
 */
export function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    (err as { digest: string }).digest.startsWith("NEXT_NOT_FOUND")
  );
}
