// Simulado (sessão 17): sorteio, correção do lote e tempo. Funções puras.

export const QUESTOES_PADRAO = 20;
export const MAX_QUESTOES = 100;
export const SEGUNDOS_POR_QUESTAO = 60; // tempo padrão: 1 min por questão
export const PONTOS_POR_ACERTO = 10; // sem bônus de tempo nem sequência (decisão de 14/11/2026)

/** N ids aleatórios (Fisher–Yates parcial), na ordem da prova. */
export function sortearIds(ids: string[], n: number, rng: () => number = Math.random) {
  const a = [...ids];
  const k = Math.min(n, a.length);
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rng() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

/** Gerador determinístico a partir de um texto (mulberry32): mesma prova recarregada = mesma ordem das alternativas. */
export function rngDeSemente(semente: string) {
  let h = 1779033703;
  for (let i = 0; i < semente.length; i++) h = Math.imul(h ^ semente.charCodeAt(i), 3432918353);
  return () => {
    h = (h + 0x6d2b79f5) | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Situacao = "acertou" | "errou" | "branco";

/**
 * Correção do lote: as respostas finais (questaoId → letra original ou V/F) contra os gabaritos, na ordem da prova.
 * Em branco conta como erro na nota (e fica fora do banco: quem grava decide). Nota de 0 a 10, uma casa.
 */
export function corrigirSimulado(itens: { id: string; gabarito: string }[], respostas: Record<string, string | null | undefined>) {
  const porQuestao = itens.map((q) => {
    const resposta = respostas[q.id] ?? null;
    const situacao: Situacao = resposta === null ? "branco" : resposta === q.gabarito ? "acertou" : "errou";
    return { id: q.id, resposta, situacao };
  });
  const acertos = porQuestao.filter((p) => p.situacao === "acertou").length;
  const total = itens.length;
  return {
    porQuestao,
    acertos,
    total,
    emBranco: porQuestao.filter((p) => p.situacao === "branco").length,
    nota: total ? Math.round((acertos / total) * 100) / 10 : 0,
    pontos: acertos * PONTOS_POR_ACERTO,
  };
}

/** Segundos que faltam (nunca negativo). */
export function segundosRestantes(iniciadaEm: Date, limiteSegundos: number, agora: Date) {
  return Math.max(0, Math.ceil(limiteSegundos - (agora.getTime() - iniciadaEm.getTime()) / 1000));
}

/** 75 → "1:15"; 3600 → "60:00". */
export const relogio = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
