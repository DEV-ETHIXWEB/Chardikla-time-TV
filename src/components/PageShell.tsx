export default function PageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="border-b-2 border-brand-ink pb-4 text-2xl font-bold text-ink sm:text-3xl">
        <span className="me-2.5 inline-block h-6 w-2 translate-y-0.5 bg-accent" />
        {title}
      </h1>
      <div className="article-body mt-8">{children}</div>
    </div>
  );
}
