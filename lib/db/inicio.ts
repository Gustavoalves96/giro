import { and, asc, count, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { disciplinas, respostas, sessoes, topicos } from "./schema";

/**
 * Respostas por hora (UTC), de toda a história. Por hora e não por dia: o dia de SP sai de diaSP no
 * servidor (agregarPorDia), e uma hora UTC nunca atravessa a meia-noite de SP (offset de horas inteiras).
 */
export async function respostasPorHora() {
  const hora = sql<Date>`date_trunc('hour', ${respostas.respondidaEm})`.mapWith((v: string) => new Date(v));
  return db.select({ em: hora, n: count() }).from(respostas).groupBy(sql`1`);
}

// shortcut: traz todas as sessões (só 3 colunas) para XP e rodadas de hoje; trocar por sum/count no SQL se ficar lento.
export async function resumoSessoes() {
  return db.select({ modo: sessoes.modo, pontuacao: sessoes.pontuacao, finalizadaEm: sessoes.finalizadaEm }).from(sessoes);
}

/** Pontos fracos: os tópicos de menor domínio entre os que já têm resposta, de disciplinas não arquivadas. */
export async function pontosFracos(limite = 3) {
  return db
    .select({ id: topicos.id, nome: topicos.nome, dominio: topicos.dominio, disciplina: disciplinas.nome, cor: disciplinas.cor })
    .from(topicos)
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .where(
      and(
        eq(disciplinas.arquivada, false),
        sql`exists (select 1 from respostas r join questoes q on q.id = r.questao_id where q.topico_id = "topicos"."id")`,
      ),
    )
    .orderBy(asc(topicos.dominio), asc(topicos.nome))
    .limit(limite);
}

export async function contarDisciplinasAtivas() {
  const [r] = await db.select({ n: count() }).from(disciplinas).where(eq(disciplinas.arquivada, false));
  return r.n;
}
