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
