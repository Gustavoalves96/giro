import { and, asc, desc, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { db } from "./index";
import { disciplinas, questoes, revisoes, sessoes, topicos } from "./schema";

// Revisão do dia (FSRS): questões e procedimentos ativos com due <= agora, de todas as disciplinas não arquivadas.

const pendente = (agora: Date) =>
  and(eq(questoes.ativa, true), eq(disciplinas.arquivada, false), lte(revisoes.due, agora));

const base = () =>
  db
    .select({
      id: questoes.id,
      tipo: questoes.tipo,
      enunciado: questoes.enunciado,
      alternativas: questoes.alternativas,
      sinalizadaComErro: questoes.sinalizadaComErro,
      disciplina: disciplinas.nome,
      cor: disciplinas.cor,
    })
    .from(revisoes)
    .innerJoin(questoes, eq(questoes.id, revisoes.questaoId))
    .innerJoin(topicos, eq(topicos.id, questoes.topicoId))
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId));

/** Quantos vencidos por disciplina (questões e procedimentos à parte, para a estimativa de tempo). */
export async function resumoRevisao(agora: Date) {
  return db
    .select({
      disciplina: disciplinas.nome,
      cor: disciplinas.cor,
      questoes: sql<number>`count(*) filter (where ${questoes.tipo} <> 'procedimento')`.mapWith(Number),
      procedimentos: sql<number>`count(*) filter (where ${questoes.tipo} = 'procedimento')`.mapWith(Number),
    })
    .from(revisoes)
    .innerJoin(questoes, eq(questoes.id, revisoes.questaoId))
    .innerJoin(topicos, eq(topicos.id, questoes.topicoId))
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .where(pendente(agora))
    .groupBy(disciplinas.id, disciplinas.nome, disciplinas.cor, disciplinas.ordem, disciplinas.criadoEm)
    .orderBy(asc(disciplinas.ordem), asc(disciplinas.criadoEm));
}

/** Próximo vencimento depois de agora (estado vazio: "próxima revisão em …"). */
export async function proximaRevisao(agora: Date) {
  const [r] = await db
    .select({ due: revisoes.due })
    .from(revisoes)
    .innerJoin(questoes, eq(questoes.id, revisoes.questaoId))
    .innerJoin(topicos, eq(topicos.id, questoes.topicoId))
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .where(and(eq(questoes.ativa, true), eq(disciplinas.arquivada, false), gt(revisoes.due, agora)))
    .orderBy(asc(revisoes.due))
    .limit(1);
  return r?.due ?? null;
}

/** Vencidos ainda não respondidos nesta sessão, do mais atrasado ao mais recente. Sem gabarito. */
export async function listarPendentesRevisao(sessaoId: string, agora: Date) {
  return base()
    .where(
      and(
        pendente(agora),
        sql`not exists (select 1 from respostas r where r.questao_id = ${questoes.id} and r.sessao_id = ${sessaoId})`,
      ),
    )
    .orderBy(asc(revisoes.due), asc(questoes.id));
}

/** Revisão aberta mais recente (sair no meio e voltar continua a mesma sessão). */
export async function revisaoAberta() {
  const [s] = await db
    .select({ id: sessoes.id })
    .from(sessoes)
    .where(and(eq(sessoes.modo, "revisao"), isNull(sessoes.finalizadaEm)))
    .orderBy(desc(sessoes.iniciadaEm))
    .limit(1);
  return s?.id ?? null;
}
