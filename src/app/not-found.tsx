import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl font-bold text-brand-ink">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink">ਸਫ਼ਾ ਨਹੀਂ ਮਿਲਿਆ</h1>
      <p className="mt-3 text-ink-soft">
        ਜਿਹੜਾ ਪੰਨਾ ਤੁਸੀਂ ਲੱਭ ਰਹੇ ਹੋ ਉਹ ਹਟਾ ਦਿੱਤਾ ਗਿਆ ਹੈ ਜਾਂ ਪਤਾ ਬਦਲ ਗਿਆ ਹੈ।
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          ਮੁੱਖ ਪੰਨਾ
        </Link>
        <Link
          href="/latest"
          className="rounded-md border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand-ink hover:text-brand-ink"
        >
          ਤਾਜ਼ਾ ਖ਼ਬਰਾਂ
        </Link>
      </div>
    </div>
  );
}
