import { and, asc, count, eq, inArray, isNull, ne, notExists, sql } from "drizzle-orm";
import { db } from "./index";
import { disciplinas, questoes, respostas, sessoes, topicos } from "./schema";

// Simulado (sessão 17): só questões (procedimento fica fora), ativas, de disciplinas não arquivadas.

const elegivel = (dono: string) =>
  and(eq(disciplinas.dono, dono), eq(questoes.ativa, true), ne(questoes.tipo, "procedimento"), eq(disciplinas.arquivada, false), eq(topicos.arquivado, false));

/** Tópicos (não arquivados, de disciplina não arquivada) com o nº de questões que podem cair no simulado. */
export async function topicosDoSimulado(dono: string) {
  return db
    .select({
      id: topicos.id,
      nome: topicos.nome,
      disciplinaId: disciplinas.id,
      disciplina: disciplinas.nome,
      cor: disciplinas.cor,
      peso: count(questoes.id),
    })
    .from(disciplinas)
    .innerJoin(topicos, eq(topicos.disciplinaId, disciplinas.id))
    .innerJoin(questoes, eq(questoes.topicoId, topicos.id))
    .where(elegivel(dono))
    .groupBy(topicos.id, topicos.nome, topicos.criadoEm, disciplinas.id, disciplinas.nome, disciplinas.cor, disciplinas.ordem, disciplinas.criadoEm)
    .orderBy(asc(disciplinas.ordem), asc(disciplinas.criadoEm), asc(topicos.criadoEm), asc(topicos.nome));
}

/** topicoIds vazio = todos os tópicos das disciplinas. */
export async function idsElegiveis(dono: string, disciplinaIds: string[], topicoIds: string[] = []) {
  const linhas = await db
    .select({ id: questoes.id })
    .from(questoes)
    .innerJoin(topicos, eq(topicos.id, questoes.topicoId))
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .where(and(elegivel(dono), inArray(disciplinas.id, disciplinaIds), topicoIds.length ? inArray(topicos.id, topicoIds) : undefined));
  return linhas.map((l) => l.id);
}

// questaoIds vêm de idsElegiveis (só da conta).
export async function criarSessaoSimulado(dono: string, questaoIds: string[], limiteSegundos: number) {
  const [s] = await db
    .insert(sessoes)
    .values({ dono, modo: "simulado", questaoIds, limiteSegundos, totalQuestoes: questaoIds.length })
    .returning({ id: sessoes.id });
  return s.id;
}

export async function getSimulado(dono: string, id: string) {
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
    .where(and(eq(sessoes.id, id), eq(sessoes.dono, dono), eq(sessoes.modo, "simulado")));
  return s ?? null;
}

/**
 * As questões sorteadas, na ordem da prova. Com gabarito: só o servidor usa (correção e resultado);
 * a tela da prova recebe só o que `QuestaoExibida` tem. Questão apagada depois do sorteio some da lista.
 */
export async function questoesDoSimulado(dono: string, ids: string[]) {
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
    .where(and(inArray(questoes.id, ids), eq(disciplinas.dono, dono)));
  const porId = new Map(linhas.map((l) => [l.id, l]));
  return ids.flatMap((id) => porId.get(id) ?? []);
}

/** Respostas gravadas na entrega: questaoId → resposta_dada. */
export async function respostasDoSimulado(dono: string, sessaoId: string) {
  const linhas = await db
    .select({ questaoId: respostas.questaoId, respostaDada: respostas.respostaDada })
    .from(respostas)
    .where(and(eq(respostas.sessaoId, sessaoId), sql`${respostas.sessaoId} in (select s.id from sessoes s where s.dono = ${dono})`));
  return Object.fromEntries(linhas.map((l) => [l.questaoId, l.respostaDada]));
}

/** Sair no meio descarta a prova: apaga a sessão só se é simulado, está aberta e não tem resposta gravada. */
export async function descartarSimulado(dono: string, id: string) {
  await db
    .delete(sessoes)
    .where(
      and(
        eq(sessoes.id, id),
        eq(sessoes.dono, dono),
        eq(sessoes.modo, "simulado"),
        isNull(sessoes.finalizadaEm),
        notExists(db.select({ x: sql`1` }).from(respostas).where(eq(respostas.sessaoId, sessoes.id))),
      ),
    );
}
