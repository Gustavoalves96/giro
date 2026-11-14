import { and, asc, count, eq, inArray, isNull, ne, notExists, sql } from "drizzle-orm";
import { db } from "./index";
import { disciplinas, questoes, respostas, sessoes, topicos } from "./schema";

// Simulado (sessão 17): só questões (procedimento fica fora), ativas, de disciplinas não arquivadas.

const elegivel = and(eq(questoes.ativa, true), ne(questoes.tipo, "procedimento"), eq(disciplinas.arquivada, false));

/** Disciplinas não arquivadas com o nº de questões que podem cair no simulado. */
export async function disciplinasDoSimulado() {
  return db
    .select({ id: disciplinas.id, nome: disciplinas.nome, cor: disciplinas.cor, questoes: count(questoes.id) })
    .from(disciplinas)
    .innerJoin(topicos, eq(topicos.disciplinaId, disciplinas.id))
    .innerJoin(questoes, eq(questoes.topicoId, topicos.id))
    .where(elegivel)
    .groupBy(disciplinas.id, disciplinas.nome, disciplinas.cor, disciplinas.ordem, disciplinas.criadoEm)
    .orderBy(asc(disciplinas.ordem), asc(disciplinas.criadoEm));
}

export async function idsElegiveis(disciplinaIds: string[]) {
  const linhas = await db
    .select({ id: questoes.id })
    .from(questoes)
    .innerJoin(topicos, eq(topicos.id, questoes.topicoId))
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .where(and(elegivel, inArray(disciplinas.id, disciplinaIds)));
  return linhas.map((l) => l.id);
}

export async function criarSessaoSimulado(questaoIds: string[], limiteSegundos: number) {
  const [s] = await db
    .insert(sessoes)
    .values({ modo: "simulado", questaoIds, limiteSegundos, totalQuestoes: questaoIds.length })
    .returning({ id: sessoes.id });
  return s.id;
}

export async function getSimulado(id: string) {
  const [s] = await db
    .select({
      id: sessoes.id,
      iniciadaEm: sessoes.iniciadaEm,
      finalizadaEm: sessoes.finalizadaEm,
      questaoIds: sessoes.questaoIds,
      limiteSegundos: sessoes.limiteSegundos,
      acertos: sessoes.acertos,
      totalQuestoes: sessoes.totalQuestoes,
      pontuacao: sessoes.pontuacao,
    })
    .from(sessoes)
    .where(and(eq(sessoes.id, id), eq(sessoes.modo, "simulado")));
  return s ?? null;
}

/**
 * As questões sorteadas, na ordem da prova. Com gabarito: só o servidor usa (correção e resultado);
 * a tela da prova recebe só o que `QuestaoExibida` tem. Questão apagada depois do sorteio some da lista.
 */
export async function questoesDoSimulado(ids: string[]) {
  if (!ids.length) return [];
  const linhas = await db
    .select({
      id: questoes.id,
      tipo: questoes.tipo,
      enunciado: questoes.enunciado,
      alternativas: questoes.alternativas,
      gabarito: questoes.gabarito,
      explicacao: questoes.explicacao,
      fonte: questoes.fonte,
      sinalizadaComErro: questoes.sinalizadaComErro,
      topico: topicos.nome,
      disciplina: disciplinas.nome,
      cor: disciplinas.cor,
    })
    .from(questoes)
    .innerJoin(topicos, eq(topicos.id, questoes.topicoId))
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .where(inArray(questoes.id, ids));
  const porId = new Map(linhas.map((l) => [l.id, l]));
  return ids.flatMap((id) => porId.get(id) ?? []);
}

/** Respostas gravadas na entrega: questaoId → resposta_dada. */
export async function respostasDoSimulado(sessaoId: string) {
  const linhas = await db
    .select({ questaoId: respostas.questaoId, respostaDada: respostas.respostaDada })
    .from(respostas)
    .where(eq(respostas.sessaoId, sessaoId));
  return Object.fromEntries(linhas.map((l) => [l.questaoId, l.respostaDada]));
}

/** Sair no meio descarta a prova: apaga a sessão só se é simulado, está aberta e não tem resposta gravada. */
export async function descartarSimulado(id: string) {
  await db
    .delete(sessoes)
    .where(
      and(
        eq(sessoes.id, id),
        eq(sessoes.modo, "simulado"),
        isNull(sessoes.finalizadaEm),
        notExists(db.select({ x: sql`1` }).from(respostas).where(eq(respostas.sessaoId, sessoes.id))),
      ),
    );
}
