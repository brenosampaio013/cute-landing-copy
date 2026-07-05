import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AgStatus = "Pendente" | "Confirmado" | "Concluído" | "Cancelado";
export type AgPagamento = "Pago" | "Pendente" | "Estornado";

export type AgendamentoRow = {
  id: string;
  rawId: string;
  servico: string;
  cliente: string;
  clienteTel: string;
  clienteEndereco: string;
  profissional: string;
  profRating: number;
  data: string;
  hora: string;
  duracao: number;
  status: AgStatus;
  pagamento: AgPagamento;
  valor: number;
  observacoes?: string;
};

const STATUS_LABEL: Record<string, AgStatus> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const PAY_LABEL: Record<string, AgPagamento> = {
  pago: "Pago",
  pendente: "Pendente",
  estornado: "Estornado",
  falhou: "Estornado",
};

function diffMin(inicio: string, fim: string) {
  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = fim.split(":").map(Number);
  return Math.max(0, (h2 * 60 + m2) - (h1 * 60 + m1));
}

async function fetchAgendamentos() {
  const { data: ags, error } = await supabase
    .from("agendamentos")
    .select(
      "id, cliente_id, profissional_id, servico, data, horario_inicio, horario_fim, status, endereco, pagamentos(valor, status)",
    )
    .order("data", { ascending: false })
    .order("horario_inicio", { ascending: false });
  if (error) throw error;

  const rows = (ags ?? []) as Array<{
    id: string;
    cliente_id: string;
    profissional_id: string | null;
    servico: string;
    data: string;
    horario_inicio: string;
    horario_fim: string;
    status: string;
    endereco: string | null;
    pagamentos: { valor: number; status: string }[] | null;
  }>;

  const ids = new Set<string>();
  rows.forEach((r) => {
    ids.add(r.cliente_id);
    if (r.profissional_id) ids.add(r.profissional_id);
  });

  const profileById = new Map<string, { nome: string | null; telefone: string | null }>();
  if (ids.size > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, nome, telefone")
      .in("id", Array.from(ids));
    (profs ?? []).forEach((p) => profileById.set(p.id, { nome: p.nome, telefone: p.telefone }));
  }

  const mapped: AgendamentoRow[] = rows.map((r) => {
    const pago = (r.pagamentos ?? [])[0];
    const cli = profileById.get(r.cliente_id);
    const prof = r.profissional_id ? profileById.get(r.profissional_id) : null;
    return {
      id: `#${r.id.slice(0, 6).toUpperCase()}`,
      rawId: r.id,
      servico: r.servico,
      cliente: cli?.nome ?? "—",
      clienteTel: cli?.telefone ?? "—",
      clienteEndereco: r.endereco ?? "—",
      profissional: prof?.nome ?? "—",
      profRating: 0,
      data: r.data,
      hora: r.horario_inicio.slice(0, 5),
      duracao: diffMin(r.horario_inicio, r.horario_fim),
      status: STATUS_LABEL[r.status] ?? "Pendente",
      pagamento: pago ? (PAY_LABEL[pago.status] ?? "Pendente") : "Pendente",
      valor: pago ? Number(pago.valor) : 0,
    };
  });

  return mapped;
}

export function useAdminAgendamentos(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-agendamentos"],
    queryFn: fetchAgendamentos,
    enabled,
    staleTime: 60_000,
  });
}
