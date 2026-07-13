// Camada de disponibilidade GLOBAL da empresa (independente de profissional).
// Combina: grade semanal global + exceções por data + regras de antecedência
// e janela futura + capacidade por slot (nº de atendimentos simultâneos).

export type DispConfig = {
  slot_duracao_min: number;
  capacidade_por_slot: number;
  antecedencia_minima_min: number;
  janela_futura_dias: number;
  poucos_horarios_threshold: number;
};

export const DEFAULT_CONFIG: DispConfig = {
  slot_duracao_min: 60,
  capacidade_por_slot: 1,
  antecedencia_minima_min: 120,
  janela_futura_dias: 60,
  poucos_horarios_threshold: 3,
};

export type DispSemanal = {
  id: string;
  dia_semana: number; // 0=Dom … 6=Sáb
  hora_inicio: string; // HH:MM[:SS]
  hora_fim: string;
  ativo: boolean;
};

export type DispExcecao = {
  id: string;
  data: string; // YYYY-MM-DD
  tipo: "bloqueio_dia" | "bloqueio_horario" | "horario_extra";
  hora_inicio: string | null;
  hora_fim: string | null;
  motivo?: string | null;
};

export type AgendamentoLite = {
  data: string;
  horario_inicio: string;
  horario_fim: string;
  status?: string | null;
};

export type GlobalSlot = {
  inicio: string; // HH:MM
  fim: string; // HH:MM
  livres: number; // capacidade restante
};

const STATUS_OCUPADOS = new Set([
  "pendente",
  "confirmado",
  "em_andamento",
  "aguardando_pagamento",
  "concluido",
]);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toMin(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fromMin(t: number): string {
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
}

function overlaps(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && b1 < a2;
}

/** Junta intervalos e subtrai bloqueios pontuais do dia. */
function windowsForDay(
  dataISO: string,
  semanal: DispSemanal[],
  excecoes: DispExcecao[],
): { start: number; end: number }[] {
  const [y, mo, d] = dataISO.split("-").map(Number);
  const diaSemana = new Date(y, (mo || 1) - 1, d || 1).getDay();

  const dayExc = excecoes.filter((e) => e.data === dataISO);
  if (dayExc.some((e) => e.tipo === "bloqueio_dia")) return [];

  const base = semanal
    .filter((h) => h.ativo && h.dia_semana === diaSemana)
    .map((h) => ({ start: toMin(h.hora_inicio), end: toMin(h.hora_fim) }));

  const extras = dayExc
    .filter((e) => e.tipo === "horario_extra" && e.hora_inicio && e.hora_fim)
    .map((e) => ({ start: toMin(e.hora_inicio!), end: toMin(e.hora_fim!) }));

  const bloqueios = dayExc
    .filter((e) => e.tipo === "bloqueio_horario" && e.hora_inicio && e.hora_fim)
    .map((e) => ({ start: toMin(e.hora_inicio!), end: toMin(e.hora_fim!) }));

  // Merge (base ∪ extras)
  const merged: { start: number; end: number }[] = [];
  [...base, ...extras]
    .sort((a, b) => a.start - b.start)
    .forEach((w) => {
      const last = merged[merged.length - 1];
      if (last && w.start <= last.end) last.end = Math.max(last.end, w.end);
      else merged.push({ ...w });
    });

  // Subtract blocks
  let result = merged;
  for (const b of bloqueios) {
    const next: { start: number; end: number }[] = [];
    for (const w of result) {
      if (b.end <= w.start || b.start >= w.end) {
        next.push(w);
        continue;
      }
      if (b.start > w.start) next.push({ start: w.start, end: Math.min(w.end, b.start) });
      if (b.end < w.end) next.push({ start: Math.max(w.start, b.end), end: w.end });
    }
    result = next;
  }
  return result.filter((w) => w.end > w.start);
}

export type ComputeGlobalArgs = {
  data: string;
  config: DispConfig;
  semanal: DispSemanal[];
  excecoes: DispExcecao[];
  agendamentos: AgendamentoLite[]; // do dia (qualquer profissional)
  agora?: Date;
};

/** Retorna todos os slots do dia (respeitando capacidade), inclusive já ocupados (livres=0). */
export function computeGlobalSlots(args: ComputeGlobalArgs): GlobalSlot[] {
  const { data, config, semanal, excecoes, agendamentos, agora = new Date() } = args;
  const janelas = windowsForDay(data, semanal, excecoes);
  if (janelas.length === 0) return [];

  const step = config.slot_duracao_min;

  // Antecedência mínima aplica ao "hoje"
  const [y, mo, d] = data.split("-").map(Number);
  const isSameDay =
    agora.getFullYear() === y && agora.getMonth() === (mo || 1) - 1 && agora.getDate() === (d || 1);
  const minMinNow = isSameDay
    ? agora.getHours() * 60 + agora.getMinutes() + config.antecedencia_minima_min
    : -Infinity;

  // Janela futura
  const horizonte = new Date(agora);
  horizonte.setHours(0, 0, 0, 0);
  horizonte.setDate(horizonte.getDate() + config.janela_futura_dias);
  const dayDate = new Date(y, (mo || 1) - 1, d || 1);
  if (dayDate.getTime() > horizonte.getTime()) return [];
  if (dayDate.getTime() < new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime())
    return [];

  const ocupacao = agendamentos
    .filter((a) => (a.status ? STATUS_OCUPADOS.has(a.status) : true))
    .map((a) => ({ start: toMin(a.horario_inicio), end: toMin(a.horario_fim) }));

  const slots: GlobalSlot[] = [];
  for (const j of janelas) {
    for (let t = j.start; t + step <= j.end; t += step) {
      if (t < minMinNow) continue;
      const fim = t + step;
      const usados = ocupacao.filter((o) => overlaps(t, fim, o.start, o.end)).length;
      const livres = Math.max(0, config.capacidade_por_slot - usados);
      slots.push({ inicio: fromMin(t), fim: fromMin(fim), livres });
    }
  }
  return slots;
}

export type DayStatus = "disponivel" | "poucos" | "indisponivel";

/**
 * Para cada dia do mês, retorna o status do dia baseado nos slots globais
 * livres e no threshold configurado.
 */
export function computeMonthStatus(args: {
  ano: number;
  mes: number; // 0-11
  config: DispConfig;
  semanal: DispSemanal[];
  excecoes: DispExcecao[];
  agendamentos: AgendamentoLite[]; // do mês inteiro
  agora?: Date;
}): Record<string, { status: DayStatus; livres: number }> {
  const { ano, mes, config, semanal, excecoes, agendamentos, agora = new Date() } = args;
  const first = new Date(ano, mes, 1);
  const last = new Date(ano, mes + 1, 0);
  const out: Record<string, { status: DayStatus; livres: number }> = {};
  for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const doDia = agendamentos.filter((a) => a.data === iso);
    const slots = computeGlobalSlots({ data: iso, config, semanal, excecoes, agendamentos: doDia, agora });
    const livres = slots.reduce((s, sl) => s + sl.livres, 0);
    let status: DayStatus;
    if (livres <= 0) status = "indisponivel";
    else if (livres <= config.poucos_horarios_threshold) status = "poucos";
    else status = "disponivel";
    out[iso] = { status, livres };
  }
  return out;
}

export const DIAS_SEMANA = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
