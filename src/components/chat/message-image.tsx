import { useAnexoUrl } from "@/hooks/queries/use-mensagens";

export function MessageImage({ path }: { path: string }) {
  const { data: url } = useAnexoUrl(path);
  if (!url) {
    return <div className="mb-2 h-32 w-48 animate-pulse rounded-lg bg-slate-200/60" />;
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="mb-2 block">
      <img
        src={url}
        alt="Anexo"
        className="max-h-64 max-w-full rounded-lg object-cover"
        loading="lazy"
      />
    </a>
  );
}
