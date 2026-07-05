import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Send, MessageSquare, Paperclip, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/queries/use-is-admin";
import { FullPageLoader } from "@/components/full-page-loader";
import { AdminShell, TEAL } from "@/components/admin/admin-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAdminConversas, useMensagens, useEnviarMensagem, useMarcarLidas, uploadAnexoChat, type Conversa } from "@/hooks/queries/use-mensagens";
import { MessageImage } from "@/components/chat/message-image";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/mensagens")({
  head: () => ({ meta: [{ title: "Mensagens — Painel Admin | Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: MensagensPage,
});

function MensagensPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user);

  useEffect(() => {
    if (loading) return;
    if (!user) return void navigate({ to: "/login", replace: true });
    if (isAdmin === false) navigate({ to: "/dashboard", replace: true });
  }, [loading, user, isAdmin, navigate]);

  const { data: conversas = [] } = useAdminConversas(isAdmin === true);
  const [ativoId, setAtivoId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const q = busca.toLowerCase();
    if (!q) return conversas;
    return conversas.filter((c) =>
      (c.usuario?.nome ?? "").toLowerCase().includes(q) ||
      (c.usuario?.email ?? "").toLowerCase().includes(q) ||
      (c.ultima_mensagem ?? "").toLowerCase().includes(q)
    );
  }, [conversas, busca]);

  useEffect(() => {
    if (!ativoId && filtradas.length > 0) setAtivoId(filtradas[0].id);
  }, [ativoId, filtradas]);

  const ativa = filtradas.find((c) => c.id === ativoId) ?? null;

  if (loading || !user || isAdmin === null || isAdmin === false) return <FullPageLoader />;

  return (
    <AdminShell active="mensagens" title="Mensagens" subtitle="Conversas com clientes e profissionais">
      <div className="grid h-[calc(100vh-220px)] min-h-[520px] gap-0 overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_20px_rgba(15,23,42,0.04)] ring-1 ring-slate-100 md:grid-cols-[340px_1fr]">
        <aside className="flex flex-col border-r border-slate-100">
          <div className="border-b border-slate-100 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar conversa..." className="pl-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtradas.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Nenhuma conversa ainda.</p>}
            {filtradas.map((c) => <ConversaItem key={c.id} c={c} active={c.id === ativoId} onClick={() => setAtivoId(c.id)} />)}
          </div>
        </aside>
        {ativa ? <ChatPanel conversa={ativa} adminId={user.id} /> : (
          <div className="flex items-center justify-center text-sm text-slate-400">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-2 h-10 w-10 text-slate-300" />
              Selecione uma conversa
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function ConversaItem({ c, active, onClick }: { c: Conversa; active: boolean; onClick: () => void }) {
  const nome = c.usuario?.nome || c.usuario?.email || "Usuário";
  const initial = nome.charAt(0).toUpperCase();
  const tipo = c.usuario?.tipo_usuario === "profissional" ? "Profissional" : "Cliente";
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition hover:bg-slate-50 ${active ? "bg-slate-50" : ""}`}
      style={active ? { boxShadow: `inset 3px 0 0 ${TEAL}` } : undefined}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ background: TEAL }}>
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-[#0A1128]">{nome}</p>
          {c.nao_lidas_admin > 0 && (
            <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{c.nao_lidas_admin}</span>
          )}
        </div>
        <p className="text-[11px] text-slate-400">{tipo}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{c.ultima_mensagem ?? "Sem mensagens ainda"}</p>
      </div>
    </button>
  );
}

function ChatPanel({ conversa, adminId }: { conversa: Conversa; adminId: string }) {
  const { data: mensagens = [] } = useMensagens(conversa.id);
  const enviar = useEnviarMensagem();
  const marcar = useMarcarLidas();
  const [texto, setTexto] = useState("");
  const [anexo, setAnexo] = useState<File | null>(null);
  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensagens.length]);

  useEffect(() => {
    if (conversa.nao_lidas_admin > 0) marcar.mutate({ conversaId: conversa.id, comoAdmin: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversa.id]);

  const nome = conversa.usuario?.nome || conversa.usuario?.email || "Usuário";
  const anexoPreview = useMemo(() => (anexo ? URL.createObjectURL(anexo) : null), [anexo]);
  useEffect(() => () => { if (anexoPreview) URL.revokeObjectURL(anexoPreview); }, [anexoPreview]);

  const submit = async () => {
    const conteudo = texto.trim();
    if (!conteudo && !anexo) return;
    try {
      setEnviandoAnexo(!!anexo);
      let anexoUrl: string | null = null;
      if (anexo) anexoUrl = await uploadAnexoChat(adminId, anexo);
      await enviar.mutateAsync({ conversaId: conversa.id, autorId: adminId, autorTipo: "admin", conteudo, anexoUrl });
      setTexto(""); setAnexo(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setEnviandoAnexo(false);
    }
  };

  return (
    <section className="flex flex-col">
      <header className="flex items-center gap-3 border-b border-slate-100 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white" style={{ background: TEAL }}>
          {nome.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0A1128]">{nome}</p>
          <p className="text-xs text-slate-500">{conversa.usuario?.email}</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#F5F7FA] p-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {mensagens.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Envie a primeira mensagem.</p>}
          {mensagens.map((m) => {
            const mine = m.autor_tipo === "admin";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${mine ? "text-white" : "bg-white text-[#0A1128]"}`}
                  style={mine ? { background: TEAL } : undefined}
                >
                  {m.anexo_url && <MessageImage path={m.anexo_url} />}
                  {m.conteudo && <p className="whitespace-pre-wrap break-words">{m.conteudo}</p>}
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
        {anexoPreview && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-50 p-2">
            <img src={anexoPreview} alt="Prévia" className="h-16 w-16 rounded object-cover" />
            <span className="flex-1 truncate text-xs text-slate-600">{anexo?.name}</span>
            <button type="button" onClick={() => setAnexo(null)} className="rounded p-1 text-slate-500 hover:bg-slate-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setAnexo(e.target.files?.[0] ?? null)}
          />
          <Button type="button" variant="outline" size="icon" onClick={() => fileRef.current?.click()} title="Anexar imagem">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Escreva uma mensagem..."
            rows={2}
            className="resize-none"
          />
          <Button
            onClick={submit}
            disabled={(!texto.trim() && !anexo) || enviar.isPending || enviandoAnexo}
            className="text-white"
            style={{ background: TEAL }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </section>
  );
}
