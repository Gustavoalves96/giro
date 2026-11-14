// Início (sessão 14): saudação, primeiro uso e retomada da rodada. Funções puras.

const horaSP = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hourCycle: "h23" });

/** "Boa noite, Ana! Bora uma rodada?" — Bom dia antes das 12 h, Boa tarde antes das 18 h (em SP). */
export function saudacao(agora: Date, nome: string | null | undefined) {
  const h = Number(horaSP.format(agora));
  const s = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return `${s}${nome ? `, ${nome}` : ""}! Bora uma rodada?`;
}

export type PrimeiroPasso = "disciplina" | "questoes" | null;

/** Primeiro uso: sem disciplina ativa → criar; sem tópico com item ativo → gerar questões; senão nada. */
export function primeiroPasso(disciplinasAtivas: number, topicosComQuestao: number): PrimeiroPasso {
  if (!topicosComQuestao) return disciplinasAtivas ? "questoes" : "disciplina";
  return null;
}

export type Etapa = "estudo" | "questoes";

/**
 * Onde a rodada aberta continua: com resposta gravada, nas questões; sem nenhuma, no estudo (o timer
 * retoma de estudo_segundos). Quem pulou para as questões e saiu sem responder volta ao estudo: o banco
 * não guarda o clique em "Já estou pronta", e um clique leva de volta.
 */
export function etapaParaContinuar(respostas: number): Etapa {
  return respostas > 0 ? "questoes" : "estudo";
}

/** Estado do timer guardado no navegador ao esconder a aba (Safari do iPad recarrega ao voltar). */
export type EstudoLocal = { sessaoId: string; acumuladoMs: number; salvoEm: number; rodando: boolean };

// Tempo fora da aba que ainda conta (ela estava no NotebookLM): até 1 h, o máximo do estudo.
const MAX_FORA = 60 * 60 * 1000;

/**
 * Tempo de onde o estudo recomeça: o maior entre o gravado no banco e o guardado neste navegador (mais
 * o tempo fora, se o timer estava rodando), limitado à duração.
 */
export function tempoRetomado(
  sessaoId: string,
  gravadoMs: number,
  local: EstudoLocal | null,
  agora: number,
  duracaoMs: number,
) {
  const meu = local?.sessaoId === sessaoId ? local : null;
  const fora = meu?.rodando ? Math.min(MAX_FORA, Math.max(0, agora - meu.salvoEm)) : 0;
  const acumuladoMs = Math.min(duracaoMs, Math.max(gravadoMs, meu ? meu.acumuladoMs + fora : 0));
  return { acumuladoMs, rodando: (meu?.rodando ?? true) && acumuladoMs < duracaoMs };
}

/** Textos do primeiro uso (Início e roleta vazia). Os dois levam a /disciplinas. */
export const TEXTO_PRIMEIRO_PASSO = {
  disciplina: {
    titulo: "Crie sua primeira disciplina",
    texto: "Cadastre a disciplina com o link do caderno dela no NotebookLM e, depois, os tópicos.",
    acao: "Criar disciplina",
  },
  questoes: {
    titulo: "Gere questões com o NotebookLM",
    texto: "Abra um tópico e use “Gerar questões com NotebookLM”. A roleta só sorteia tópicos com questões.",
    acao: "Escolher um tópico",
  },
} as const;
