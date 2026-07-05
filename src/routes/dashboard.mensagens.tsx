import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Headset, Paperclip, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMinhaConversa, useMensagens, useEnviarMensagem, useMarcarLidas, uploadAnexoChat } from "@/hooks/queries/use-mensagens";
import { MessageImage } from "@/components/chat/message-image";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/mensagens")({
  head: () => ({ meta: [{ title: "Mensagens — Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: MinhasMensagens,
});

function MinhasMensagens() {
  const { user } = useAuth();
  const { data: conversa } = useMinhaConversa(user);
  const { data: mensagens = [] } = useMensagens(conversa?.id ?? null);
  const enviar = useEnviarMensagem();
  const marcar = useMarcarLidas();
  const [texto, setTexto] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensagens.length]);

  useEffect(() => {
    if (conversa && conversa.nao_lidas_usuario > 0) {
      marcar.mutate({ conversaId: conversa.id, comoAdmin: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversa?.id]);

  const submit = () => {
    const conteudo = texto.trim();
    if (!conteudo || !user || !conversa) return;
    enviar.mutate({ conversaId: conversa.id, autorId: user.id, autorTipo: "usuario", conteudo });
    setTexto("");
  };

  return (
    <>
      <PageHeading title="Mensagens" subtitle="Fale com o suporte da Maré Nobre." />
      <div className="flex h-[calc(100vh-260px)] min-h-[520px] flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <header className="flex items-center gap-3 border-b border-slate-100 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2DD4BF]/10 text-[#0A1A2F]">
            <Headset className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0A1A2F]">Suporte Maré Nobre</p>
            <p className="text-xs text-slate-500">Respondemos em horário comercial</p>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#F5F7FA] p-6">
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            {mensagens.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">
                Envie a primeira mensagem para o suporte.
              </p>
            )}
            {mensagens.map((m) => {
              const mine = m.autor_tipo === "usuario";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${mine ? "bg-[#0A1A2F] text-white" : "bg-white text-[#0A1A2F]"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.conteudo}</p>
                    <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                      {new Date(m.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="border-t border-slate-100 bg-white p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Escreva uma mensagem..."
              rows={2}
              className="resize-none"
              disabled={!conversa}
            />
            <Button onClick={submit} disabled={!texto.trim() || !conversa || enviar.isPending} className="bg-[#2DD4BF] text-white hover:bg-[#2DD4BF]/90">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      </div>
    </>
  );
}
