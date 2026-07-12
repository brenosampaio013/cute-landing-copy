import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Clock, Home, Star, ChevronRight, CheckCircle2, Loader2, Inbox } from "lucide-react";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/queries/use-profile";


export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — Maré Nobre" }] }),
  component: DashboardHome,
});

type Agendamento = {
  id: string;
  servico: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  status: "confirmado" | "concluido" | "cancelado" | "pendente";
  endereco: string | null;
};

type Pagamento = {
  id: string;
  agendamento_id: string;
  valor: number;
  status: "pago" | "pendente" | "estornado";
  data_pagamento: string | null;
  metodo: string | null;
};

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function statusBadge(s: Agendamento["status"]) {
  const map: Record<string, string> = {
    confirmado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    concluido: "bg-slate-100 text-slate-700 ring-slate-200",
    cancelado: "bg-red-50 text-red-700 ring-red-200",
    pendente: "bg-amber-50 text-amber-700 ring-amber-200",
  };
  const label: Record<string, string> = {
    confirmado: "Confirmado",
    concluido: "Concluído",
    cancelado: "Cancelado",
    pendente: "Pendente",
  };
  return { cls: map[s], label: label[s] };
}

function DashboardHome() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const nome = profile?.nome ?? "";
  const [loading, setLoading] = useState(true);
  const [proximo, setProximo] = useState<Agendamento | null>(null);
  const [pagamento, setPagamento] = useState<Pagamento | null>(null);
  const [bookings, setBookings] = useState<Agendamento[]>([]);
  const [avaliar, setAvaliar] = useState<Agendamento | null>(null);
  const [rating, setRating] = useState(0);
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const [proxRes, listRes, avalRes] = await Promise.all([
        supabase
          .from("agendamentos")
          .select("*")
          .eq("cliente_id", user.id)
          .eq("status", "confirmado")
          .gte("data", today)
          .order("data", { ascending: true })
          .order("horario_inicio", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("agendamentos")
          .select("*")
          .eq("cliente_id", user.id)
          .order("data", { ascending: false })
          .limit(5),
        supabase
          .from("agendamentos")
          .select("*, avaliacoes(id)")
          .eq("cliente_id", user.id)
          .eq("status", "concluido")
          .order("data", { ascending: false }),
      ]);
      if (cancelled) return;
      setProximo((proxRes.data as Agendamento | null) ?? null);
      setBookings((listRes.data as Agendamento[] | null) ?? []);


      // Buscar pagamento mais relevante: do próximo agendamento, ou o mais recente do cliente
      if (proxRes.data) {
        const { data: p } = await supabase
          .from("pagamentos")
          .select("*")
          .eq("agendamento_id", proxRes.data.id)
          .maybeSingle();
        if (!cancelled) setPagamento((p as Pagamento | null) ?? null);
      } else {
        const { data: p } = await supabase
          .from("pagamentos")
          .select("*, agendamentos!inner(cliente_id)")
          .eq("agendamentos.cliente_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled) setPagamento((p as Pagamento | null) ?? null);
      }

      const semAval = (avalRes.data as (Agendamento & { avaliacoes: { id: string }[] })[] | null)?.find(
        (a) => !a.avaliacoes || a.avaliacoes.length === 0
      );
      setAvaliar(semAval ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function submitRating() {
    if (!user || !avaliar || rating < 1) return;
    setSaving(true);
    const { error } = await supabase.from("avaliacoes").insert({
      agendamento_id: avaliar.id,
      cliente_id: user.id,
      nota: rating,
    });
    setSaving(false);
    if (!error) {
      setAvaliar(null);
      setRating(0);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <h1
        className="text-3xl text-[#0A1A2F] sm:text-4xl"
        style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
      >
        Dashboard
      </h1>

      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-xl font-bold text-[#0A1A2F] sm:text-2xl">
          Olá, {nome || "cliente"}! 👋
        </h2>
        <p className="mt-1 text-sm text-slate-500">Tudo do seu lar num só lugar — agendamentos, pagamentos e histórico.</p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-2">
          <h3
            className="text-lg text-[#0A1A2F]"
            style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
          >
            Próximo agendamento
          </h3>

          {proximo ? (
            <>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <Home className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#0A1A2F]">{proximo.servico}</p>
                    {proximo.endereco && (
                      <p className="text-xs text-slate-500">{proximo.endereco}</p>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadge(proximo.status).cls}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusBadge(proximo.status).label}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#2DD4BF]" />
                  {formatDate(proximo.data)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#2DD4BF]" />
                  {proximo.horario_inicio.slice(0, 5)} — {proximo.horario_fim.slice(0, 5)}
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Nenhum serviço agendado"
              hint="Que tal deixar o próximo detalhe do lar com a gente? Agende em 2 minutos."
            />
          )}
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                pagamento?.status === "pago"
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Status do pagamento</p>
              <p className="text-lg font-bold text-[#0A1A2F]">
                {pagamento
                  ? pagamento.status === "pago"
                    ? "Pago"
                    : pagamento.status === "pendente"
                      ? "Pendente"
                      : "Estornado"
                  : "Sem pagamento"}
              </p>
            </div>
          </div>
          {pagamento ? (
            <p className="mt-4 text-sm text-slate-500">
              Valor{" "}
              <span className="font-medium text-slate-700">
                R$ {Number(pagamento.valor).toFixed(2)}
              </span>
              {pagamento.metodo && <> · {pagamento.metodo}</>}
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Nenhum pagamento por aqui ainda — seus recibos aparecerão logo após o primeiro serviço.
            </p>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3
              className="text-lg text-[#0A1A2F]"
              style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
            >
              Meus agendamentos
            </h3>
            <a
              href="/dashboard/agendamentos"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#2DD4BF] hover:text-[#14b8a6]"
            >
              Ver todos <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          {bookings.length ? (
            <ul className="mt-5 divide-y divide-slate-100">
              {bookings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                      <Home className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0A1A2F]">{b.servico}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(b.data)} · {b.horario_inicio.slice(0, 5)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadge(b.status).cls}`}
                  >
                    {statusBadge(b.status).label}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Inbox}
              title="Você ainda não tem agendamentos"
              hint="Quando agendar um serviço, ele aparecerá aqui."
            />
          )}
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h3
            className="text-lg text-[#0A1A2F]"
            style={{ fontFamily: "var(--font-serif-bold)", fontWeight: 700 }}
          >
            Avalie seu último serviço
          </h3>

          {avaliar ? (
            <>
              <div className="mt-5">
                <p className="text-sm font-semibold text-[#0A1A2F]">{avaliar.servico}</p>
                <p className="text-xs text-slate-500">{formatDate(avaliar.data)}</p>
              </div>

              <div className="mt-5 flex justify-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = i < rating;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Dar ${i + 1} estrela${i ? "s" : ""}`}
                      onClick={() => setRating(i + 1)}
                      className="transition hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          filled ? "fill-amber-400 text-amber-400" : "text-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <button
                onClick={submitRating}
                disabled={rating < 1 || saving}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A1A2F] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Avaliar
              </button>
            </>
          ) : (
            <EmptyState
              icon={Star}
              title="Sem avaliações pendentes"
              hint="Você já avaliou todos os seus serviços concluídos."
            />
          )}
        </section>
      </div>
    </>
  );
}

function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  hint: string;
}) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center py-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-3 text-sm font-semibold text-[#0A1A2F]">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}


