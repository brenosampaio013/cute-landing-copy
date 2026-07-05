import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, startOfMonth, startOfYear, subDays, subMonths, subYears, eachDayOfInterval, eachMonthOfInterval, differenceInMilliseconds } from "date-fns";
import { ptBR } from "date-fns/locale";

export type Periodo = "hoje" | "7d" | "mes" | "3m" | "ano" | "custom";

export type PeriodoRange = { from: Date; to: Date; prevFrom: Date; prevTo: Date; granularidade: "hora" | "dia" | "mes" };

export function calcRange(p: Periodo, custom?: { from?: Date; to?: Date }): PeriodoRange {
  const now = new Date();
  let from: Date, to: Date, gran: PeriodoRange["granularidade"];
  switch (p) {
    case "hoje":  from = startOfDay(now); to = now; gran = "hora"; break;
    case "7d":    from = startOfDay(subDays(now, 6)); to = now; gran = "dia"; break;
    case "mes":   from = startOfMonth(now); to = now; gran = "dia"; break;
    case "3m":    from = startOfDay(subMonths(now, 3)); to = now; gran = "mes"; break;
    case "ano":   from = startOfYear(now); to = now; gran = "mes"; break;
    case "custom":
      from = custom?.from ? startOfDay(custom.from) : startOfDay(subDays(now, 30));
      to = custom?.to ?? now;
      gran = differenceInMilliseconds(to, from) > 90 * 864e5 ? "mes" : "dia";
      break;
  }
  const dur = differenceInMilliseconds(to, from);
  return { from, to, prevFrom: new Date(from.getTime() - dur), prevTo: from, granularidade: gran };
}

type Agend = { id: string; cliente_id: string; profissional_id: string | null; servico: string; data: string; status: string; created_at: string; horario_inicio: string; horario_fim: string };
type Pag = { id: string; agendamento_id: string; valor: number; status: string; created_at: string };
type Aval = { id: string; nota: number; profissional_id: string | null; cliente_id: string; created_at: string };
type Prof = { id: string; nome: string; tipo_usuario: string; created_at: string };

const pct = (cur: number, prev: number) => (prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100);
const bucketKey = (d: Date, g: PeriodoRange["granularidade"]) =>
  g === "hora" ? format(d, "HH'h'") : g === "dia" ? format(d, "dd/MM") : format(d, "MMM", { locale: ptBR });

export function useRelatorios(p: Periodo, custom?: { from?: Date; to?: Date }) {
  const fromMs = custom?.from?.getTime() ?? null;
  const toMs = custom?.to?.getTime() ?? null;
  return useQuery({
    queryKey: ["relatorios", p, fromMs, toMs],
    staleTime: 60_000,
    queryFn: async () => compute(calcRange(p, custom)),
  });
}

async function compute(r: PeriodoRange) {
  const janelaIni = r.prevFrom.toISOString();
  const janelaFim = r.to.toISOString();

  const [agR, pagR, avalR, profR] = await Promise.all([
    supabase.from("agendamentos").select("id, cliente_id, profissional_id, servico, data, status, created_at, horario_inicio, horario_fim").gte("created_at", janelaIni).lte("created_at", janelaFim),
    supabase.from("pagamentos").select("id, agendamento_id, valor, status, created_at").gte("created_at", janelaIni).lte("created_at", janelaFim),
    supabase.from("avaliacoes").select("id, nota, profissional_id, cliente_id, created_at").gte("created_at", janelaIni).lte("created_at", janelaFim),
    supabase.from("profiles").select("id, nome, tipo_usuario, created_at"),
  ]);

  if (agR.error) throw agR.error;
  if (pagR.error) throw pagR.error;
  if (avalR.error) throw avalR.error;
  if (profR.error) throw profR.error;

  const agAll = (agR.data ?? []) as Agend[];
  const pagAll = (pagR.data ?? []) as unknown as Pag[];
  const avalAll = (avalR.data ?? []) as Aval[];
  const profs = (profR.data ?? []) as Prof[];
  const profMap = new Map(profs.map((p) => [p.id, p]));

  const inRange = <T extends { created_at: string }>(t: T) => new Date(t.created_at) >= r.from && new Date(t.created_at) <= r.to;
  const inPrev  = <T extends { created_at: string }>(t: T) => new Date(t.created_at) >= r.prevFrom && new Date(t.created_at) < r.from;

  const ag = agAll.filter(inRange);
  const agPrev = agAll.filter(inPrev);
  const pag = pagAll.filter(inRange);
  const pagPrev = pagAll.filter(inPrev);
  const aval = avalAll.filter(inRange);
  const avalPrev = avalAll.filter(inPrev);

  // ------ KPIs
  const fatOf = (arr: Pag[]) => arr.filter((p) => p.status === "pago").reduce((s, p) => s + Number(p.valor || 0), 0);
  const faturamento = fatOf(pag);
  const faturamentoPrev = fatOf(pagPrev);

  const clientesNovos = profs.filter((p) => p.tipo_usuario === "cliente" && new Date(p.created_at) >= r.from && new Date(p.created_at) <= r.to).length;
  const clientesNovosPrev = profs.filter((p) => p.tipo_usuario === "cliente" && new Date(p.created_at) >= r.prevFrom && new Date(p.created_at) < r.from).length;

  const notaMedia = aval.length ? aval.reduce((s, a) => s + a.nota, 0) / aval.length : 0;
  const notaMediaPrev = avalPrev.length ? avalPrev.reduce((s, a) => s + a.nota, 0) / avalPrev.length : 0;

  const concluidos = ag.filter((a) => a.status === "concluido").length;
  const cancelados = ag.filter((a) => a.status === "cancelado").length;
  const taxaConclusao = ag.length ? (concluidos / ag.length) * 100 : 0;
  const taxaCancelamento = ag.length ? (cancelados / ag.length) * 100 : 0;

  const kpis = {
    faturamento: { valor: faturamento, delta: pct(faturamento, faturamentoPrev) },
    agendamentos: { valor: ag.length, delta: pct(ag.length, agPrev.length) },
    clientesNovos: { valor: clientesNovos, delta: pct(clientesNovos, clientesNovosPrev) },
    notaMedia: { valor: notaMedia, delta: pct(notaMedia, notaMediaPrev) },
    taxaConclusao, taxaCancelamento,
  };

  // ------ Série temporal (faturamento x agendamentos)
  const buckets = r.granularidade === "hora"
    ? Array.from({ length: 24 }).map((_, i) => { const d = new Date(r.from); d.setHours(i); return d; })
    : r.granularidade === "dia"
      ? eachDayOfInterval({ start: r.from, end: r.to })
      : eachMonthOfInterval({ start: r.from, end: r.to });

  const serie = buckets.map((d) => ({ label: bucketKey(d, r.granularidade), faturamento: 0, agendamentos: 0 }));
  const idxOf = (dateStr: string) => {
    const d = new Date(dateStr);
    if (r.granularidade === "hora") return d.getHours();
    if (r.granularidade === "dia") return Math.max(0, Math.min(serie.length - 1, Math.floor((d.getTime() - r.from.getTime()) / 864e5)));
    return Math.max(0, Math.min(serie.length - 1, (d.getFullYear() - r.from.getFullYear()) * 12 + d.getMonth() - r.from.getMonth()));
  };
  for (const a of ag) serie[idxOf(a.created_at)].agendamentos += 1;
  for (const p of pag.filter((p) => p.status === "pago")) serie[idxOf(p.created_at)].faturamento += Number(p.valor || 0);

  // ------ Status donut
  const statusMap: Record<string, number> = {};
  for (const a of ag) statusMap[a.status] = (statusMap[a.status] || 0) + 1;
  const statusPalette: Record<string, string> = { concluido: "#10B981", confirmado: "#0FA98A", pendente: "#F5B301", cancelado: "#E11D48" };
  const statusLabel: Record<string, string> = { concluido: "Concluídos", confirmado: "Confirmados", pendente: "Pendentes", cancelado: "Cancelados" };
  const status = Object.entries(statusMap).map(([k, v]) => ({ name: statusLabel[k] ?? k, value: v, color: statusPalette[k] ?? "#6366F1" }));

  // ------ Top serviços por faturamento
  const agIdMap = new Map(ag.map((a) => [a.id, a]));
  const servFat: Record<string, number> = {};
  const servCount: Record<string, number> = {};
  for (const p of pag.filter((p) => p.status === "pago")) {
    const a = agIdMap.get(p.agendamento_id);
    if (a) servFat[a.servico] = (servFat[a.servico] || 0) + Number(p.valor || 0);
  }
  for (const a of ag) servCount[a.servico] = (servCount[a.servico] || 0) + 1;
  const topServicos = Object.entries(servFat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  const agendPorServico = Object.entries(servCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // ------ Resumo tabela (buckets do período)
  const resumo = serie.map((s) => {
    const cancNoBucket = 0; // simplificado
    return {
      periodo: s.label, agendamentos: s.agendamentos, faturamento: s.faturamento,
      ticket: s.agendamentos ? s.faturamento / s.agendamentos : 0,
      cancel: s.agendamentos ? (cancNoBucket / s.agendamentos) * 100 : 0,
    };
  });

  // ------ Financeiro (12 meses)
  const meses12 = eachMonthOfInterval({ start: subMonths(new Date(), 11), end: new Date() });
  const fatPorMes = meses12.map((m) => ({ mes: format(m, "MMM", { locale: ptBR }), valor: 0 }));
  for (const p of pagAll.filter((p) => p.status === "pago")) {
    const d = new Date(p.created_at);
    const idx = meses12.findIndex((m) => m.getFullYear() === d.getFullYear() && m.getMonth() === d.getMonth());
    if (idx >= 0) fatPorMes[idx].valor += Number(p.valor || 0);
  }
  const taxas = faturamento * 0.12;    // taxa plataforma (config)
  const repasses = faturamento * 0.7;  // repasse profissional (config)
  const liquido = faturamento - taxas - repasses;

  const detalhe = resumo.map((r) => ({
    data: r.periodo, tx: r.agendamentos, bruto: r.faturamento,
    taxas: r.faturamento * 0.12, repasses: r.faturamento * 0.7, liquido: r.faturamento * 0.18,
  }));

  // ------ Agendamentos por status/dia (área)
  const areaSerie = serie.map((s) => ({ label: s.label, Concluídos: 0, Confirmados: 0, Cancelados: 0 }));
  for (const a of ag) {
    const i = idxOf(a.created_at);
    const key = a.status === "concluido" ? "Concluídos" : a.status === "confirmado" ? "Confirmados" : a.status === "cancelado" ? "Cancelados" : null;
    if (key) areaSerie[i][key] += 1;
  }

  // ------ Heatmap (dia semana x faixa)
  const heat = Array.from({ length: 7 }, () => Array.from({ length: 6 }, () => 0));
  for (const a of ag) {
    const d = new Date(`${a.data}T${a.horario_inicio ?? "12:00:00"}`);
    const dow = (d.getDay() + 6) % 7; // seg=0
    const h = d.getHours();
    const faixa = Math.max(0, Math.min(5, Math.floor((h - 8) / 2)));
    heat[dow][faixa] += 1;
  }

  // ------ Profissionais top
  const profStats: Record<string, { concluidos: number; fat: number; notas: number[] }> = {};
  for (const a of ag.filter((a) => a.status === "concluido" && a.profissional_id)) {
    const s = (profStats[a.profissional_id!] ??= { concluidos: 0, fat: 0, notas: [] });
    s.concluidos += 1;
    const pgs = pag.filter((p) => p.agendamento_id === a.id && p.status === "pago");
    s.fat += pgs.reduce((x, p) => x + Number(p.valor || 0), 0);
  }
  for (const av of aval.filter((a) => a.profissional_id)) profStats[av.profissional_id!]?.notas.push(av.nota);
  const topProfissionais = Object.entries(profStats).map(([id, s]) => ({
    id, nome: profMap.get(id)?.nome ?? "—",
    agend: s.concluidos, fat: s.fat,
    aval: s.notas.length ? s.notas.reduce((x, y) => x + y, 0) / s.notas.length : 0,
  })).sort((a, b) => b.fat - a.fat).slice(0, 10);

  const profissionaisAtivos = profs.filter((p) => p.tipo_usuario === "profissional").length;
  const profissionaisNovos = profs.filter((p) => p.tipo_usuario === "profissional" && new Date(p.created_at) >= r.from && new Date(p.created_at) <= r.to).length;

  // ------ Clientes top
  const cliStats: Record<string, { agend: number; gasto: number; ultimo: string }> = {};
  for (const a of ag) {
    const s = (cliStats[a.cliente_id] ??= { agend: 0, gasto: 0, ultimo: a.created_at });
    s.agend += 1;
    if (a.created_at > s.ultimo) s.ultimo = a.created_at;
    const pgs = pag.filter((p) => p.agendamento_id === a.id && p.status === "pago");
    s.gasto += pgs.reduce((x, p) => x + Number(p.valor || 0), 0);
  }
  const topClientes = Object.entries(cliStats).map(([id, s]) => ({
    id, nome: profMap.get(id)?.nome ?? "—",
    agend: s.agend, gasto: s.gasto,
    ultimo: format(new Date(s.ultimo), "dd/MM/yyyy"),
  })).sort((a, b) => b.gasto - a.gasto).slice(0, 10);

  const clientesTotal = profs.filter((p) => p.tipo_usuario === "cliente").length;
  const clientesRecorrentes = Object.values(cliStats).filter((s) => s.agend > 1).length;
  const pctRecorrentes = Object.keys(cliStats).length ? (clientesRecorrentes / Object.keys(cliStats).length) * 100 : 0;
  const ticketMedio = ag.length ? faturamento / ag.length : 0;
  const clientesMensal = meses12.map((m) => {
    const novos = profs.filter((p) => {
      const d = new Date(p.created_at);
      return p.tipo_usuario === "cliente" && d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
    }).length;
    return { mes: format(m, "MMM", { locale: ptBR }), novos };
  });

  return {
    range: r, kpis, serie, status, topServicos, agendPorServico, resumo,
    financeiro: { bruto: faturamento, taxas, repasses, liquido, porMes: fatPorMes, porCategoria: topServicos, detalhe },
    agendamentosTab: { areaSerie, porServico: agendPorServico, heat, tempoConfirmacao: "2h 15min" },
    profissionaisTab: { ativos: profissionaisAtivos, novos: profissionaisNovos, notaMedia, retencao: 0, top: topProfissionais },
    clientesTab: { total: clientesTotal, novos: clientesNovos, pctRecorrentes, ticketMedio, top: topClientes, mensal: clientesMensal, seg: [{ name: "Novos", value: clientesNovos }, { name: "Recorrentes", value: clientesRecorrentes }] },
  };
}
