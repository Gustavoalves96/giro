// Conferência de um procedimento (lembrei / com erro / esqueci por passo). Funções puras.

export const NOTAS = ["lembrei", "com_erro", "esqueci"] as const;
export type Nota = (typeof NOTAS)[number];
export type Notas = Record<string, Nota>; // passoId → nota

type Passo = { id: string; critico: boolean };

/** Fração lembrada: (lembrei + 0,5 × com_erro) / total. Sem passos = 0. */
export function fracaoLembrada(notas: Nota[]) {
  if (!notas.length) return 0;
  const pontos = notas.reduce((t, n) => t + (n === "lembrei" ? 1 : n === "com_erro" ? 0.5 : 0), 0);
  return pontos / notas.length;
}

export const LIMIAR_ACERTO = 0.8;

/** acertou = fração ≥ 0,8 e nenhum passo crítico esquecido. `criticosEsquecidos` = ids, na ordem dos passos. */
export function avaliarProcedimento(passos: Passo[], notas: Notas) {
  const fracao = fracaoLembrada(passos.map((p) => notas[p.id] ?? "esqueci"));
  const criticosEsquecidos = passos.filter((p) => p.critico && notas[p.id] === "esqueci").map((p) => p.id);
  return { fracao, criticosEsquecidos, acertou: fracao >= LIMIAR_ACERTO && criticosEsquecidos.length === 0 };
}

/** As notas cobrem exatamente os passos atuais: nenhum faltando, nenhum a mais, nenhum id desconhecido. */
export function notasCobremPassos(passos: { id: string }[], notas: Notas) {
  const ids = Object.keys(notas);
  return ids.length === passos.length && passos.every((p) => Object.hasOwn(notas, p.id));
}
