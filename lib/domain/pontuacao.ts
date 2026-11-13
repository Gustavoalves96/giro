// Pontuação por questão (CLAUDE.md §4.4). Funções puras.

export type RespostaPontuada = { acertou: boolean; tempoMs: number };

/**
 * Acerto: 10 + bônus de tempo round(max(0, 5 × (1 − s/60))); ×1,5 a partir do 3º acerto seguido. Erro: 0.
 * `sequenciaAtual` = acertos seguidos contando esta questão.
 */
export function pontosQuestao({ acertou, tempoMs, sequenciaAtual }: RespostaPontuada & { sequenciaAtual: number }) {
  if (!acertou) return 0;
  const pontos = 10 + Math.round(Math.max(0, 5 * (1 - tempoMs / 1000 / 60)));
  return sequenciaAtual >= 3 ? Math.round(pontos * 1.5) : pontos;
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
