export function PageHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1
        className="text-3xl text-[#0A1A2F] sm:text-4xl"
        style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
      >
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}
