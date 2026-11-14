// Números do Início e das estatísticas (CLAUDE.md §4.7; docs/plano/README.md › "O que conta onde").
// O servidor do Vercel roda em UTC: todo "hoje" e todo agrupamento por dia passa por diaSP.

import { hojeEmSP } from "./provas";

const DIA = 24 * 60 * 60 * 1000;

/** Dia civil (AAAA-MM-DD) em America/Sao_Paulo. 01:00 UTC ainda é o dia anterior em SP. */
export const diaSP = (d: Date) => hojeEmSP(d);

/** `dia` (AAAA-MM-DD) somado de `n` dias (negativo volta). */
export function somarDias(dia: string, n: number) {
  return new Date(Date.parse(dia) + n * DIA).toISOString().slice(0, 10);
}

/**
 * Dias seguidos com atividade, terminando hoje ou ontem: hoje ainda sem resposta não zera antes do dia
 * acabar. Buraco de um dia zera.
 */
export function streak(diasComAtividade: Iterable<string>, hoje: string) {
  const dias = new Set(diasComAtividade);
  let dia = dias.has(hoje) ? hoje : somarDias(hoje, -1);
  let n = 0;
  while (dias.has(dia)) {
    n++;
    dia = somarDias(dia, -1);
  }
  return n;
}

/** XP total: soma das pontuações das sessões finalizadas (aberta não conta). */
export function xpTotal(sessoes: { pontuacao: number; finalizadaEm: Date | null }[]) {
  return sessoes.reduce((t, s) => t + (s.finalizadaEm ? s.pontuacao : 0), 0);
}

/** Soma `n` por dia em SP. */
export function agregarPorDia(eventos: { em: Date; n: number }[]) {
  const m = new Map<string, number>();
  for (const e of eventos) {
    const d = diaSP(e.em);
    m.set(d, (m.get(d) ?? 0) + e.n);
  }
  return m;
}

/** Rodadas de hoje: sessões da roleta finalizadas hoje em SP. */
export function rodadasHoje(sessoes: { modo: string; finalizadaEm: Date | null }[], hoje: string) {
  return sessoes.filter((s) => s.modo === "roleta" && s.finalizadaEm && diaSP(s.finalizadaEm) === hoje).length;
}

export type DiaMapa = { dia: string; n: number; futuro: boolean };

/**
 * Mapa de calor: `semanas` colunas de domingo a sábado, a última com hoje. Dias depois de hoje vêm
 * marcados como futuros (célula vazia).
 */
export function mapaDeCalor(porDia: ReadonlyMap<string, number>, hoje: string, semanas = 14): DiaMapa[][] {
  const domingo = somarDias(hoje, -new Date(Date.parse(hoje)).getUTCDay());
  const inicio = somarDias(domingo, -7 * (semanas - 1));
  return Array.from({ length: semanas }, (_, s) =>
    Array.from({ length: 7 }, (_, d) => {
      const dia = somarDias(inicio, s * 7 + d);
      return { dia, n: porDia.get(dia) ?? 0, futuro: dia > hoje };
    }),
  );
}

/** Maior sequência de dias seguidos com atividade, em todo o histórico. */
export function maiorSequencia(diasComAtividade: Iterable<string>) {
  const dias = [...new Set(diasComAtividade)].sort();
  let maior = 0;
  let atual = 0;
  dias.forEach((d, i) => {
    atual = i > 0 && somarDias(dias[i - 1], 1) === d ? atual + 1 : 1;
    maior = Math.max(maior, atual);
  });
  return maior;
}

export type Semana = { inicio: string; respostas: number; acertos: number; segundos: number };

/**
 * As últimas `semanas` semanas (segunda a domingo, dia de SP), a última com hoje. Semana sem dados vem
 * zerada; evento fora do período é ignorado.
 */
export function agregarPorSemana(
  eventos: { em: Date; respostas?: number; acertos?: number; segundos?: number }[],
  hoje: string,
  semanas = 8,
): Semana[] {
  const segunda = somarDias(hoje, -((new Date(Date.parse(hoje)).getUTCDay() + 6) % 7));
  const inicio = somarDias(segunda, -7 * (semanas - 1));
  const lista = Array.from({ length: semanas }, (_, i) => ({ inicio: somarDias(inicio, 7 * i), respostas: 0, acertos: 0, segundos: 0 }));
  for (const e of eventos) {
    const i = Math.floor((Date.parse(diaSP(e.em)) - Date.parse(inicio)) / (7 * DIA));
    const s = lista[i];
    if (!s) continue;
    s.respostas += e.respostas ?? 0;
    s.acertos += e.acertos ?? 0;
    s.segundos += e.segundos ?? 0;
  }
  return lista;
}

/** % de acertos da primeira e da última semana com resposta (`fim` null com uma semana só; null sem nenhuma). */
export function acertosInicioFim(semanas: Semana[]) {
  const com = semanas.filter((s) => s.respostas > 0);
  if (!com.length) return null;
  const pct = (s: Semana) => Math.round((100 * s.acertos) / s.respostas);
  return { inicio: pct(com[0]), fim: com.length > 1 ? pct(com[com.length - 1]) : null };
}
