import { and, asc, desc, eq, isNotNull, isNull, lt, lte, max, ne, sql } from "drizzle-orm";
import { db } from "./index";
import { disciplinas, questoes, respostas, revisoes, sessoes, topicos } from "./schema";

// Sessão da roleta (estudo → questões → resultado).

export async function criarSessaoRoleta(topicoId: string) {
  const [s] = await db.insert(sessoes).values({ modo: "roleta", topicoId }).returning({ id: sessoes.id });
  return s.id;
}

// Sessão com tópico e disciplina (left join: o tópico pode ter sido excluído, topico_id vira null).
export async function getSessao(id: string) {
  const [s] = await db
    .select({
      id: sessoes.id,
      modo: sessoes.modo,
      iniciadaEm: sessoes.iniciadaEm,
      finalizadaEm: sessoes.finalizadaEm,
      estudoSegundos: sessoes.estudoSegundos,
      totalQuestoes: sessoes.totalQuestoes,
      acertos: sessoes.acertos,
      pontuacao: sessoes.pontuacao,
      maiorSequencia: sessoes.maiorSequencia,
      topicoId: topicos.id,
      topico: topicos.nome,
      descricao: topicos.descricao,
      disciplina: disciplinas.nome,
      cor: disciplinas.cor,
      notebooklmUrl: disciplinas.notebooklmUrl,
    })
    .from(sessoes)
    .leftJoin(topicos, eq(topicos.id, sessoes.topicoId))
    .leftJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .where(eq(sessoes.id, id));
  return s ?? null;
}

// Só enquanto a sessão está aberta. false = não existe ou já finalizada.
export async function salvarEstudoSessao(id: string, estudoSegundos: number) {
  const r = await db
    .update(sessoes)
    .set({ estudoSegundos })
    .where(and(eq(sessoes.id, id), isNull(sessoes.finalizadaEm)))
    .returning({ id: sessoes.id });
  return r.length > 0;
}

export async function sessaoAberta(id: string) {
  const [s] = await db
    .select({ id: sessoes.id })
    .from(sessoes)
    .where(and(eq(sessoes.id, id), isNull(sessoes.finalizadaEm)));
  return !!s;
}

// Candidatas da sessão: questões ativas do tópico ainda não respondidas NESTA sessão, com o que
// selecionarQuestoes() precisa (due da revisão, nº de respostas e de erros). Sem gabarito.
export async function listarCandidatasSessao(topicoId: string, sessaoId: string) {
  return db
    .select({
      id: questoes.id,
      tipo: questoes.tipo,
      enunciado: questoes.enunciado,
      alternativas: questoes.alternativas,
      sinalizadaComErro: questoes.sinalizadaComErro,
      disciplina: disciplinas.nome,
      cor: disciplinas.cor,
      due: revisoes.due,
      respostas: sql<number>`(select count(*) from respostas r where r.questao_id = "questoes"."id")`.mapWith(Number),
      erros: sql<number>`(select count(*) from respostas r where r.questao_id = "questoes"."id" and not r.acertou)`.mapWith(
        Number,
      ),
    })
    .from(questoes)
    .innerJoin(topicos, eq(topicos.id, questoes.topicoId))
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .leftJoin(revisoes, eq(revisoes.questaoId, questoes.id))
    .where(
      and(
        eq(questoes.topicoId, topicoId),
        eq(questoes.ativa, true),
        sql`not exists (select 1 from respostas r where r.questao_id = "questoes"."id" and r.sessao_id = ${sessaoId})`,
      ),
    )
    .orderBy(asc(questoes.criadoEm), asc(questoes.id));
}

// Respostas da sessão em ordem, com o enunciado (resultado e retomada das questões).
export async function respostasDaSessao(sessaoId: string) {
  return db
    .select({
      questaoId: respostas.questaoId,
      enunciado: questoes.enunciado,
      acertou: respostas.acertou,
      tempoMs: respostas.tempoMs,
    })
    .from(respostas)
    .innerJoin(questoes, eq(questoes.id, respostas.questaoId))
    .where(eq(respostas.sessaoId, sessaoId))
    .orderBy(asc(respostas.respondidaEm), asc(respostas.id));
}

/**
 * Grava o resumo uma vez só: o UPDATE só pega sessão aberta. Devolve o topico_id se foi esta chamada
 * que finalizou; null se a sessão não existe ou já estava finalizada (nada é regravado).
 */
export async function fecharSessao(
  id: string,
  resumo: { totalQuestoes: number; acertos: number; pontuacao: number; maiorSequencia: number },
) {
  // now() do banco: mesmo relógio de respostas.respondida_em, que é comparado com finalizada_em
  const [s] = await db
    .update(sessoes)
    .set({ ...resumo, finalizadaEm: sql`now()` })
    .where(and(eq(sessoes.id, id), isNull(sessoes.finalizadaEm)))
    .returning({ topicoId: sessoes.topicoId, finalizadaEm: sessoes.finalizadaEm });
  return s ?? null;
}

/** Acertos das últimas 20 respostas do tópico até `ate` (inclusive ou não), da mais recente para a mais antiga. */
export async function acertosRecentesTopico(topicoId: string, ate: Date, inclusive: boolean) {
  const linhas = await db
    .select({ acertou: respostas.acertou })
    .from(respostas)
    .innerJoin(questoes, eq(questoes.id, respostas.questaoId))
    .where(and(eq(questoes.topicoId, topicoId), inclusive ? lte(respostas.respondidaEm, ate) : lt(respostas.respondidaEm, ate)))
    .orderBy(desc(respostas.respondidaEm), desc(respostas.id))
    .limit(20);
  return linhas.map((l) => l.acertou);
}

export async function atualizarDominioTopico(topicoId: string, dominio: number, estudadoEm: Date) {
  await db.update(topicos).set({ dominio, ultimaVezEstudado: estudadoEm }).where(eq(topicos.id, topicoId));
}

/** Maior pontuação entre as sessões finalizadas antes desta (qualquer modo, exceto simulado). */
export async function recordeAnterior(id: string, finalizadaEm: Date) {
  const [r] = await db
    .select({ max: max(sessoes.pontuacao) })
    .from(sessoes)
    .where(
      and(
        ne(sessoes.id, id),
        ne(sessoes.modo, "simulado"),
        isNotNull(sessoes.finalizadaEm),
        lt(sessoes.finalizadaEm, finalizadaEm),
      ),
    );
  return r?.max ?? 0;
}
