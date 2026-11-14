import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "./index";
import { respostasPassos, sessoes, topicos } from "./schema";

/** Tempo de estudo gravado por hora (UTC) de início da sessão, mesmo de rodada aberta. Ver respostasPorHora. */
export async function estudoPorHora() {
  const hora = sql<Date>`date_trunc('hour', ${sessoes.iniciadaEm})`.mapWith((v: string) => new Date(v));
  const segundos = sql<number>`sum(${sessoes.estudoSegundos})`.mapWith(Number);
  return db.select({ em: hora, segundos }).from(sessoes).where(sql`${sessoes.estudoSegundos} > 0`).groupBy(sql`1`);
}

/** Recordes: as sessões da roleta finalizadas de maior pontuação (tópico null se foi apagado). */
export async function topSessoes(limite = 10) {
  return db
    .select({ id: sessoes.id, pontuacao: sessoes.pontuacao, finalizadaEm: sessoes.finalizadaEm, topicoId: topicos.id, topico: topicos.nome })
    .from(sessoes)
    .leftJoin(topicos, eq(topicos.id, sessoes.topicoId))
    .where(and(eq(sessoes.modo, "roleta"), isNotNull(sessoes.finalizadaEm)))
    .orderBy(desc(sessoes.pontuacao), desc(sessoes.finalizadaEm))
    .limit(limite);
}

export async function praticouProcedimento() {
  const [r] = await db.select({ um: sql`1` }).from(respostasPassos).limit(1);
  return Boolean(r);
}

/**
 * Passos que ela mais esquece: notas "esqueci"/"com erro" por passo, de procedimentos ativos de disciplinas não
 * arquivadas (mesmo recorte do caderno de erros). O join com o checklist atual tira o passo que foi apagado.
 */
export async function passosEsquecidos(limite = 10) {
  const r = await db.execute<{ questao_id: string; procedimento: string; topico_id: string; passo: string; n: number }>(sql`
    select q.id as questao_id, q.enunciado as procedimento, q.topico_id, p.passo->>'texto' as passo, count(*)::int as n
    from respostas_passos rp
    join respostas r on r.id = rp.resposta_id
    join questoes q on q.id = r.questao_id
    join topicos t on t.id = q.topico_id
    join disciplinas d on d.id = t.disciplina_id
    cross join lateral jsonb_array_elements(q.checklist->'passos') with ordinality as p(passo, ordem)
    where p.passo->>'id' = rp.passo_id and rp.nota in ('esqueci', 'com_erro') and q.ativa and not d.arquivada
    group by q.id, q.enunciado, q.topico_id, p.passo->>'texto', p.ordem
    order by n desc, q.enunciado, p.ordem
    limit ${limite}`);
  return r.rows;
}
