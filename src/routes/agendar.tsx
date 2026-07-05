import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SitePage } from "@/components/site-page";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import iconLimpeza from "@/assets/icon-limpeza.png.asset.json";
import iconPosObra from "@/assets/icon-posobra.png.asset.json";
import iconPassadoria from "@/assets/icon-passadoria.png.asset.json";
import iconJardinagem from "@/assets/icon-jardinagem.png.asset.json";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar serviço — Maré Nobre" }] }),
  component: Agendar,
});

const services = [
  { icon: iconLimpeza.url, title: "Limpeza Residencial" },
  { icon: iconPosObra.url, title: "Limpeza Pós-obra" },
  { icon: iconPassadoria.url, title: "Passadoria" },
  { icon: iconJardinagem.url, title: "Jardinagem" },
];

type Pro = { id: string; nome: string | null };

function addHour(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  d.setHours(d.getHours() + 1);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Agendar() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [pros, setPros] = useState<Pro[]>([]);
  const [servico, setServico] = useState<string>(services[0].title);
  const [profissionalId, setProfissionalId] = useState<string>("");
  const [data, setData] = useState<string>("");
  const [horario, setHorario] = useState<string>("");
  const [endereco, setEndereco] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, nome")
        .eq("tipo_usuario", "profissional");
      setPros(data ?? []);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("Faça login para agendar.");
      navigate({ to: "/login" });
      return;
    }
    if (!servico || !data || !horario) {
      toast.error("Preencha serviço, data e horário.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("agendamentos").insert({
      cliente_id: user.id,
      profissional_id: profissionalId || null,
      servico,
      data,
      horario_inicio: horario,
      horario_fim: addHour(horario),
      endereco: endereco || null,
      status: "pendente",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível agendar. Tente novamente.");
      return;
    }
    toast.success("Agendamento criado!");
    navigate({ to: "/dashboard/agendamentos" });
  }

  const today = new Date().toISOString().slice(0, 10);
  const inputCls =
    "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20";
  const labelCls = "text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <SitePage
      title="Agendar serviço"
      subtitle="Escolha o serviço, o profissional, a data e o horário. Confirmação em minutos."
    >
      <form
        onSubmit={handleSubmit}
        className="grid gap-8 lg:grid-cols-[1fr_1.2fr]"
      >
        <div>
          <p className={labelCls}>1. Escolha o serviço</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {services.map((s) => {
              const active = servico === s.title;
              return (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setServico(s.title)}
                  className={`flex flex-col items-center rounded-xl border bg-white p-4 text-center transition ${
                    active
                      ? "border-[#2DD4BF] ring-2 ring-[#2DD4BF]/20 shadow-md"
                      : "border-slate-200 hover:border-[#2DD4BF] hover:shadow-md"
                  }`}
                >
                  <img src={s.icon} alt={s.title} className="h-14 w-14 object-contain" />
                  <span className="mt-2 text-sm font-semibold text-brand-navy">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <p className={labelCls}>2. Profissional</p>
          <select
            value={profissionalId}
            onChange={(e) => setProfissionalId(e.target.value)}
            className={inputCls}
          >
            <option value="">Sem preferência</option>
            {pros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome || "Profissional"}
              </option>
            ))}
          </select>

          <p className={`${labelCls} pt-2`}>3. Data e horário</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Data</span>
              <input
                type="date"
                required
                min={today}
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Horário</span>
              <input
                type="time"
                required
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className={inputCls}
              />
            </label>
          </div>

          <label className="block">
            <span className={labelCls}>Endereço</span>
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className={inputCls}
              placeholder="Rua, número, bairro"
            />
          </label>

          <button
            type="submit"
            disabled={submitting || authLoading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2DD4BF] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar agendamento
          </button>
          {!user && !authLoading && (
            <p className="text-center text-xs text-slate-500">
              Você precisa estar logado para concluir o agendamento.
            </p>
          )}
        </div>
      </form>
    </SitePage>
  );
}
