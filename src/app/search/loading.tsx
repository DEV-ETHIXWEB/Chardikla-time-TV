/**
 * Scoped to /search deliberately.
 *
 * A `loading.tsx` opens a Suspense boundary, and Next begins streaming the
 * response — which flushes HTTP 200 before the page body runs. Any route that
 * can call `notFound()` then returns a soft 404: the 404 UI with a 200 status.
 * That cost us correct status codes on every article, category and tag until
 * the root-level loading file was removed.
 *
 * /search is always a 200, so a skeleton is safe here. Do not add one at the
 * app root or above any route that can 404.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-8">
      <div className="mb-8 h-9 w-40 rounded bg-surface-soft" />
      <div className="grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[16/10] rounded-lg bg-surface-soft" />
            <div className="h-3 w-full rounded bg-surface-soft" />
            <div className="h-3 w-3/5 rounded bg-surface-soft" />
          </div>
        ))}
      </div>
    </div>
  );
}
