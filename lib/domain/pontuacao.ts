// Pontuação por questão (CLAUDE.md §4.4) e por procedimento (sessão 11). Funções puras.

/** `fracao` (0..1) só em procedimento: a fração lembrada do checklist. Questão: ausente ou null. */
export type RespostaPontuada = { acertou: boolean; tempoMs: number; fracao?: number | null };

/**
 * Questão — acerto: 10 + bônus de tempo round(max(0, 5 × (1 − s/60))); erro: 0.
 * Procedimento — round(10 × fração), sem bônus de tempo (vale mesmo sem "acertou": crédito parcial).
 * Os dois: ×1,5 a partir do 3º acerto seguido. `sequenciaAtual` = acertos seguidos contando este item.
 */
export function pontosQuestao({ acertou, tempoMs, fracao, sequenciaAtual }: RespostaPontuada & { sequenciaAtual: number }) {
  const pontos =
    fracao != null ? Math.round(10 * fracao) : acertou ? 10 + Math.round(Math.max(0, 5 * (1 - tempoMs / 1000 / 60))) : 0;
  return acertou && sequenciaAtual >= 3 ? Math.round(pontos * 1.5) : pontos;
}

/** Total de pontos, acertos, maior sequência e a sequência no fim (para o selo e a próxima questão). */
export function resumoSessao(respostas: RespostaPontuada[]) {
  let total = 0;
  let acertos = 0;
  let sequencia = 0;
  let maiorSequencia = 0;
  for (const r of respostas) {
    sequencia = r.acertou ? sequencia + 1 : 0;
    maiorSequencia = Math.max(maiorSequencia, sequencia);
    if (r.acertou) acertos++;
    total += pontosQuestao({ ...r, sequenciaAtual: sequencia });
  }
  return { total, acertos, maiorSequencia, sequencia };
}
