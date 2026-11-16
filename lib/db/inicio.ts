import { and, asc, count, eq, lte, sql } from "drizzle-orm";
import { questaoDoDono } from "./dono";
import { db } from "./index";
import { disciplinas, respostas, sessoes, topicos } from "./schema";

/**
 * Respostas por hora (UTC), de toda a história. Por hora e não por dia: o dia de SP sai de diaSP no
 * servidor (agregarPorDia), e uma hora UTC nunca atravessa a meia-noite de SP (offset de horas inteiras).
 */
export async function respostasPorHora(dono: string) {
  const hora = sql<Date>`date_trunc('hour', ${respostas.respondidaEm})`.mapWith((v: string) => new Date(v));
  const acertos = sql<number>`count(*) filter (where ${respostas.acertou})`.mapWith(Number);
  return db
    .select({ em: hora, n: count(), acertos })
    .from(respostas)
    .where(questaoDoDono(dono, respostas.questaoId))
    .groupBy(sql`1`);
}

// shortcut: traz todas as sessões (só 3 colunas) para XP e rodadas de hoje; trocar por sum/count no SQL se ficar lento.
export async function resumoSessoes(dono: string) {
  return db
    .select({ modo: sessoes.modo, pontuacao: sessoes.pontuacao, finalizadaEm: sessoes.finalizadaEm })
    .from(sessoes)
    .where(eq(sessoes.dono, dono));
}

/** XP total até o fim de uma sessão (ela inclusa): o "depois" do nível no resultado, igual ao recarregar. */
export async function xpAte(dono: string, finalizadaEm: Date) {
  const [r] = await db
    .select({ xp: sql<number>`coalesce(sum(${sessoes.pontuacao}), 0)`.mapWith(Number) })
    .from(sessoes)
    .where(and(eq(sessoes.dono, dono), lte(sessoes.finalizadaEm, finalizadaEm)));
  return r?.xp ?? 0;
}

/**
 * Pontos fracos (Início, 3) e ranking das Estatísticas (null = todos): os tópicos de menor domínio entre os que têm resposta de sessão finalizada (o domínio só é
 * recalculado ao finalizar), de disciplinas não arquivadas. Resposta sem sessão (anterior à sessão 12) conta.
 */
export async function pontosFracos(dono: string, limite: number | null = 3) {
  const q = db
    .select({ id: topicos.id, nome: topicos.nome, dominio: topicos.dominio, disciplina: disciplinas.nome, cor: disciplinas.cor })
    .from(topicos)
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .where(
      and(
        eq(disciplinas.dono, dono),
        eq(disciplinas.arquivada, false),
        sql`exists (select 1 from respostas r join questoes q on q.id = r.questao_id left join sessoes s on s.id = r.sessao_id
          where q.topico_id = "topicos"."id" and (r.sessao_id is null or s.finalizada_em is not null))`,
      ),
    )
    .orderBy(asc(topicos.dominio), asc(topicos.nome))
    .$dynamic();
  return limite === null ? q : q.limit(limite);
}

export async function contarDisciplinasAtivas(dono: string) {
  const [r] = await db
    .select({ n: count() })
    .from(disciplinas)
    .where(and(eq(disciplinas.dono, dono), eq(disciplinas.arquivada, false)));
  return r.n;
}
