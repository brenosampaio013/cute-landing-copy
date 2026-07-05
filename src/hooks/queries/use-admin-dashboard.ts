import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ---------- types ---------- */
export type BookingStatus = "pendente" | "confirmado" | "concluido" | "cancelado";
export type PaymentStatus = "pendente" | "pago" | "estornado" | "falhou";

type AgRow = {
  id: string;
  cliente_id: string;
  profissional_id: string | null;
  servico: string;
  data: string;
  horario_inicio: string;
  status: BookingStatus;
  created_at: string;
  pagamentos: { valor: number; status: PaymentStatus }[] | null;
};

type ProfileRow = {
  id: string;
  nome: string | null;
  foto_url: string | null;
  tipo_usuario: "cliente" | "profissional" | "admin";
  created_at: string;
};

const STATUS_LABEL: Record<BookingStatus, "Confirmado" | "Pendente" | "Concluído" | "Cancelado"> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const PAYMENT_LABEL: Record<PaymentStatus, "Pago" | "Pendente" | "Estornado"> = {
  pago: "Pago",
  pendente: "Pendente",
  estornado: "Estornado",
  falhou: "Estornado",
};

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtShortDay(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

async function fetchDashboard() {
  const today = new Date();
  const start30 = new Date();
  start30.setDate(today.getDate() - 29);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [ags, profs, ratings] = await Promise.all([
    supabase
      .from("agendamentos")
      .select(
        "id, cliente_id, profissional_id, servico, data, horario_inicio, status, created_at, pagamentos(valor, status)",
      )
      .gte("data", ymd(start30))
      .order("data", { ascending: false })
      .order("horario_inicio", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, nome, foto_url, tipo_usuario, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("avaliacoes").select("nota"),
  ]);

  const agendamentos = (ags.data ?? []) as AgRow[];
  const profiles = (profs.data ?? []) as ProfileRow[];
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  /* KPIs */
  const todayStr = ymd(today);
  const kpiHoje = agendamentos.filter((a) => a.data === todayStr).length;

  const faturamentoMes = agendamentos
    .filter((a) => new Date(a.data) >= monthStart)
    .reduce((s, a) => s + (a.pagamentos ?? []).filter((p) => p.status === "pago").reduce((x, p) => x + Number(p.valor), 0), 0);

  const profissionaisAtivos = profiles.filter((p) => p.tipo_usuario === "profissional").length;

  const notas = (ratings.data ?? []) as { nota: number }[];
  const avaliacaoMedia = notas.length ? notas.reduce((s, n) => s + n.nota, 0) / notas.length : null;

  /* Line chart — últimos 7 dias */
  const last7: { day: string; concluidos: number; confirmados: number; cancelados: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const key = ymd(d);
    const rows = agendamentos.filter((a) => a.data === key);
    last7.push({
      day: fmtShortDay(key),
      concluidos: rows.filter((r) => r.status === "concluido").length,
      confirmados: rows.filter((r) => r.status === "confirmado").length,
      cancelados: rows.filter((r) => r.status === "cancelado").length,
    });
  }

  /* Donut */
  const donut = (["concluido", "confirmado", "pendente", "cancelado"] as BookingStatus[]).map((s) => ({
    key: s,
    name: STATUS_LABEL[s],
    value: agendamentos.filter((a) => a.status === s).length,
  }));

  /* Recentes (5) */
  const recentes = agendamentos.slice(0, 5).map((a) => ({
    id: a.id,
    servico: a.servico,
    cliente: profileById.get(a.cliente_id)?.nome ?? "Cliente",
    status: STATUS_LABEL[a.status],
    hora: `${new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${a.horario_inicio.slice(0, 5)}`,
  }));

  /* Tabela */
  const tabela = agendamentos.slice(0, 25).map((a) => {
    const pago = (a.pagamentos ?? [])[0];
    return {
      id: `#${a.id.slice(0, 6).toUpperCase()}`,
      servico: a.servico,
      cliente: profileById.get(a.cliente_id)?.nome ?? "—",
      profissional: a.profissional_id ? profileById.get(a.profissional_id)?.nome ?? "—" : "—",
      data: `${new Date(a.data + "T00:00:00").toLocaleDateString("pt-BR")} ${a.horario_inicio.slice(0, 5)}`,
      status: STATUS_LABEL[a.status],
      pagamento: pago ? PAYMENT_LABEL[pago.status] : "Pendente",
      valor: pago ? Number(pago.valor) : 0,
    };
  });

  /* Bar chart — faturamento diário do mês */
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const bar = Array.from({ length: daysInMonth }, (_, i) => {
    const key = ymd(new Date(today.getFullYear(), today.getMonth(), i + 1));
    const v = agendamentos
      .filter((a) => a.data === key)
      .reduce((s, a) => s + (a.pagamentos ?? []).filter((p) => p.status === "pago").reduce((x, p) => x + Number(p.valor), 0), 0);
    return { d: String(i + 1).padStart(2, "0"), v };
  });

  /* Top serviços */
  const svcMap = new Map<string, { qtd: number; valor: number }>();
  for (const a of agendamentos) {
    const cur = svcMap.get(a.servico) ?? { qtd: 0, valor: 0 };
    cur.qtd += 1;
    cur.valor += (a.pagamentos ?? []).filter((p) => p.status === "pago").reduce((x, p) => x + Number(p.valor), 0);
    svcMap.set(a.servico, cur);
  }
  const topServicos = [...svcMap.entries()]
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.valor - a.valor || b.qtd - a.qtd)
    .slice(0, 4);

  /* Cadastros recentes */
  const cadastros = profiles.slice(0, 4).map((p) => ({
    nome: p.nome ?? "Usuário",
    tipo: p.tipo_usuario === "profissional" ? "Profissional" : p.tipo_usuario === "admin" ? "Admin" : "Cliente",
    data: new Date(p.created_at).toLocaleDateString("pt-BR"),
    foto: p.foto_url,
  }));

  /* Financeiro do mês */
  const bruto = agendamentos
    .filter((a) => new Date(a.data) >= monthStart)
    .reduce((s, a) => s + (a.pagamentos ?? []).filter((p) => p.status === "pago").reduce((x, p) => x + Number(p.valor), 0), 0);
  const taxas = bruto * 0.1;
  const repasses = bruto * 0.05;

  return {
    kpi: {
      hoje: kpiHoje,
      faturamentoMes,
      profissionaisAtivos,
      avaliacaoMedia,
    },
    line: last7,
    donut,
    recentes,
    tabela,
    bar,
    topServicos,
    cadastros,
    financeiro: { bruto, taxas, repasses, liquido: bruto - taxas - repasses },
  };
}

export function useAdminDashboard(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchDashboard,
    enabled,
    staleTime: 60_000,
  });
}
