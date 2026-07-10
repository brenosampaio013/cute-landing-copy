// Utilitário de cálculo de slots disponíveis para agendamento.
// Combina: grade semanal (profissional_horarios) + bloqueios pontuais
// (profissional_bloqueios) + agendamentos existentes, para uma data e
// duração de serviço.

export type Horario = {
  id: string;
  profissional_id: string;
  dia_semana: number; // 0=Dom ... 6=Sáb
  hora_inicio: string; // "HH:MM" ou "HH:MM:SS"
  hora_fim: string;
  ativo: boolean;
};

export type Bloqueio = {
  id: string;
  profissional_id: string;
  data_inicio: string; // ISO timestamp
  data_fim: string;
  motivo?: string | null;
};

export type Agendamento = {
  id: string;
  data: string; // "YYYY-MM-DD"
  horario_inicio: string; // "HH:MM" ou "HH:MM:SS"
  horario_fim: string;
  status?: string | null;
};

export type Slot = {
  inicio: string; // "HH:MM"
  fim: string; // "HH:MM"
  inicioISO: string; // ISO local
  fimISO: string;
};

const STATUS_OCUPADOS = new Set([
  "pendente",
  "confirmado",
  "em_andamento",
  "aguardando_pagamento",
]);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseHM(hm: string): { h: number; m: number } {
  const [h, m] = hm.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

function toMinutes(hm: string): number {
  const { h, m } = parseHM(hm);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad(h)}:${pad(m)}`;
}

/**
 * Constrói um Date local a partir de "YYYY-MM-DD" + minutos do dia.
 * Usa componentes locais para evitar deslocamentos de timezone.
 */
function dateAt(dataISO: string, minutes: number): Date {
  const [y, mo, d] = dataISO.split("-").map(Number);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return new Date(y, (mo || 1) - 1, d || 1, h, m, 0, 0);
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export type ComputeSlotsInput = {
  /** Data do serviço "YYYY-MM-DD" */
  data: string;
  /** Duração do serviço em minutos */
  duracaoMin: number;
  /** Grade semanal ativa do profissional */
  horarios: Horario[];
  /** Bloqueios pontuais do profissional */
  bloqueios: Bloqueio[];
  /** Agendamentos já existentes do profissional na data */
  agendamentos: Agendamento[];
  /** Granularidade dos slots em minutos (default 30) */
  stepMin?: number;
  /** Antecedência mínima (default: agora) */
  agora?: Date;
};

/**
 * Retorna a lista de slots disponíveis para o profissional na data,
 * respeitando grade semanal, bloqueios e agendamentos existentes.
 */
export function computeAvailableSlots(input: ComputeSlotsInput): Slot[] {
  const {
    data,
    duracaoMin,
    horarios,
    bloqueios,
    agendamentos,
    stepMin = 30,
    agora = new Date(),
  } = input;

  if (!data || duracaoMin <= 0) return [];

  const [y, mo, d] = data.split("-").map(Number);
  const dayDate = new Date(y, (mo || 1) - 1, d || 1);
  const diaSemana = dayDate.getDay();

  const janelas = horarios
    .filter((h) => h.ativo && h.dia_semana === diaSemana)
    .map((h) => ({ start: toMinutes(h.hora_inicio), end: toMinutes(h.hora_fim) }))
    .sort((a, b) => a.start - b.start);

  if (janelas.length === 0) return [];

  // Intervalos ocupados no dia (em minutos locais)
  const ocupados: { start: number; end: number }[] = [];

  // Agendamentos existentes
  for (const ag of agendamentos) {
    if (ag.status && !STATUS_OCUPADOS.has(ag.status) && ag.status !== "concluido") continue;
    ocupados.push({
      start: toMinutes(ag.horario_inicio),
      end: toMinutes(ag.horario_fim),
    });
  }

  // Bloqueios pontuais — projetar sobre o dia
  const dayStart = dateAt(data, 0).getTime();
  const dayEnd = dateAt(data, 24 * 60).getTime();
  for (const b of bloqueios) {
    const bi = new Date(b.data_inicio).getTime();
    const bf = new Date(b.data_fim).getTime();
    if (Number.isNaN(bi) || Number.isNaN(bf)) continue;
    if (bf <= dayStart || bi >= dayEnd) continue;
    const startMin = Math.max(0, Math.floor((bi - dayStart) / 60000));
    const endMin = Math.min(24 * 60, Math.ceil((bf - dayStart) / 60000));
    if (endMin > startMin) ocupados.push({ start: startMin, end: endMin });
  }

  const nowMin =
    agora.getFullYear() === y &&
    agora.getMonth() === (mo || 1) - 1 &&
    agora.getDate() === (d || 1)
      ? agora.getHours() * 60 + agora.getMinutes()
      : -Infinity;

  const slots: Slot[] = [];
  for (const j of janelas) {
    for (let t = j.start; t + duracaoMin <= j.end; t += stepMin) {
      const fim = t + duracaoMin;
      if (t <= nowMin) continue;
      const conflito = ocupados.some((o) => overlaps(t, fim, o.start, o.end));
      if (conflito) continue;
      slots.push({
        inicio: fromMinutes(t),
        fim: fromMinutes(fim),
        inicioISO: dateAt(data, t).toISOString(),
        fimISO: dateAt(data, fim).toISOString(),
      });
    }
  }

  return slots;
}

/**
 * Retorna, para uma janela de N dias a partir de "hoje", os dias em que o
 * profissional tem ao menos um slot disponível.
 */
export function nextAvailableDays(
  diasDaSemanaAtivos: number[],
  janelaDias = 14,
  agora: Date = new Date(),
): string[] {
  const set = new Set(diasDaSemanaAtivos);
  const out: string[] = [];
  for (let i = 0; i < janelaDias; i++) {
    const d = new Date(agora);
    d.setDate(agora.getDate() + i);
    if (set.has(d.getDay())) {
      out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    }
  }
  return out;
}
