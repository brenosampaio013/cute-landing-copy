import { Loader2 } from "lucide-react";

/**
 * Spinner centralizado em tela cheia, usado enquanto a sessão ou dados
 * críticos de uma rota protegida estão carregando.
 */
export function FullPageLoader({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-[#F5F7FA] text-slate-500 ${className}`}
    >
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
