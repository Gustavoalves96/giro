// Medalhas (CLAUDE.md §4.7). Funções puras: o banco monta os Fatos, aqui só se decide quais foram ganhas.

/** Mínimos para as medalhas de "perfeição" não saírem de graça numa sessão de 1 questão. */
export const MIN_RODADA_PERFEITA = 5;
export const MIN_SIMULADO_DEZ = 10;

export type Fatos = {
  sessoesFinalizadas: number;
  xp: number;
  respostas: number;
  maiorSequencia: number; // dias seguidos, de sempre
  rodadaPerfeita: boolean;
  simuladoDez: boolean;
  procedimentoPerfeito: boolean;
  topicoDominado: boolean;
  revisaoEmDia: boolean;
  cadernoVazio: boolean;
};

export type Grupo = "inicio" | "ofensiva" | "xp" | "respostas" | "feito";

type Medalha = { id: string; nome: string; comoGanhar: string; grupo: Grupo; ganhou: (f: Fatos) => boolean };

const marcos = (grupo: Grupo, valores: [number, string][], comoGanhar: (n: string) => string, de: (f: Fatos) => number) =>
  valores.map(
    ([n, nome]): Medalha => ({ id: `${grupo}-${n}`, nome, comoGanhar: comoGanhar(n.toLocaleString("pt-BR")), grupo, ganhou: (f) => de(f) >= n }),
  );

/** Ordem de exibição. O `id` é gravado no banco: nunca renomear. */
export const MEDALHAS: Medalha[] = [
  { id: "primeiro-giro", nome: "Primeiro giro", comoGanhar: "Termine sua primeira sessão.", grupo: "inicio", ganhou: (f) => f.sessoesFinalizadas >= 1 },
  ...marcos("ofensiva", [[3, "Aquecendo"], [7, "Uma semana"], [30, "Um mês"], [100, "Cem dias"]], (n) => `Estude ${n} dias seguidos.`, (f) => f.maiorSequencia),
  ...marcos("xp", [[1000, "Mil XP"], [5000, "5 mil XP"], [20000, "20 mil XP"]], (n) => `Junte ${n} XP.`, (f) => f.xp),
  ...marcos("respostas", [[100, "Cem respostas"], [500, "500 respostas"], [1000, "Mil respostas"]], (n) => `Responda ${n} questões ou procedimentos.`, (f) => f.respostas),
  { id: "rodada-perfeita", nome: "Gabaritou", comoGanhar: `Acerte tudo numa rodada da roleta de ${MIN_RODADA_PERFEITA} ou mais questões.`, grupo: "feito", ganhou: (f) => f.rodadaPerfeita },
  { id: "simulado-dez", nome: "Nota 10", comoGanhar: `Tire 10 num simulado de ${MIN_SIMULADO_DEZ} ou mais questões.`, grupo: "feito", ganhou: (f) => f.simuladoDez },
  { id: "procedimento-perfeito", nome: "Passo a passo", comoGanhar: "Lembre todos os passos de um procedimento.", grupo: "feito", ganhou: (f) => f.procedimentoPerfeito },
  { id: "topico-dominado", nome: "Domínio total", comoGanhar: "Chegue a 100% de domínio num tópico (com 10 ou mais respostas).", grupo: "feito", ganhou: (f) => f.topicoDominado },
  { id: "revisao-em-dia", nome: "Em dia", comoGanhar: "Termine uma revisão do dia e não deixe nada vencido.", grupo: "feito", ganhou: (f) => f.revisaoEmDia },
  { id: "caderno-vazio", nome: "Caderno limpo", comoGanhar: "Refaça os erros até o caderno de erros ficar vazio.", grupo: "feito", ganhou: (f) => f.cadernoVazio },
];

export const medalhaPorId = (id: string) => MEDALHAS.find((m) => m.id === id);

/** Ids das medalhas que os fatos garantem, na ordem de MEDALHAS. */
export function medalhasGanhas(f: Fatos) {
  return MEDALHAS.filter((m) => m.ganhou(f)).map((m) => m.id);
}

/** Rodada perfeita e nota 10 a partir das sessões finalizadas. */
export function feitosDeSessoes(sessoes: { modo: string; finalizadaEm: Date | null; acertos: number; totalQuestoes: number }[]) {
  const fin = sessoes.filter((s) => s.finalizadaEm);
  const perfeita = (modo: string, min: number) => fin.some((s) => s.modo === modo && s.totalQuestoes >= min && s.acertos === s.totalQuestoes);
  return { rodadaPerfeita: perfeita("roleta", MIN_RODADA_PERFEITA), simuladoDez: perfeita("simulado", MIN_SIMULADO_DEZ) };
}

/**
 * Medalhas de quem já tinha histórico antes delas existirem entram sem comemoração (sem sessão): é o caso
 * da conta sem nenhuma medalha gravada que já tinha outra sessão finalizada antes desta.
 */
export function eRetroativa(medalhasGravadas: number, sessoesFinalizadas: number) {
  return medalhasGravadas === 0 && sessoesFinalizadas > 1;
}
