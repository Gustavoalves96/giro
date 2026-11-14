import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "./index";
import type { Estado } from "@/lib/domain/fsrs";
import type { Nota } from "@/lib/domain/procedimento";
import { type NovaResposta, questoes, respostas, respostasPassos, revisoes } from "./schema";

// Consultas da tela de questão (components/quiz). O gabarito só sai daqui depois da resposta.

// Procedimento para a conferência: checklist só sai do servidor quando ela pede para conferir.
export async function getProcedimento(id: string) {
  const [q] = await db
    .select({
      tipo: questoes.tipo,
      ativa: questoes.ativa,
      checklist: questoes.checklist,
      explicacao: questoes.explicacao,
      fonte: questoes.fonte,
    })
    .from(questoes)
    .where(eq(questoes.id, id));
  return q ?? null;
}

// Para conferir a resposta no servidor.
export async function getGabarito(id: string) {
  const [q] = await db
    .select({
      alternativas: questoes.alternativas,
      tipo: questoes.tipo,
      gabarito: questoes.gabarito,
      explicacao: questoes.explicacao,
      fonte: questoes.fonte,
    })
    .from(questoes)
    .where(eq(questoes.id, id));
  return q ?? null;
}

// Estado FSRS atual do item (null = nunca agendado).
export async function getRevisao(questaoId: string): Promise<Estado | null> {
  const { due, stability, difficulty, elapsedDays, scheduledDays, reps, lapses, state, lastReview } = getTableColumns(revisoes);
  const [r] = await db
    .select({ due, stability, difficulty, elapsedDays, scheduledDays, reps, lapses, state, lastReview })
    .from(revisoes)
    .where(eq(revisoes.questaoId, questaoId));
  return r ?? null;
}

/**
 * Resposta, notas dos passos (procedimento) e o novo estado FSRS numa transação só (batch do neon-http).
 * Já respondida nesta sessão: o índice único derruba o batch inteiro e devolve false (nada gravado).
 */
export async function gravarResposta(dados: Omit<NovaResposta, "id">, notas: Record<string, Nota> | null, estado: Estado) {
  const respostaId = crypto.randomUUID();
  const passos = notas ? Object.entries(notas).map(([passoId, nota]) => ({ respostaId, passoId, nota })) : [];
  try {
    await db.batch([
      db.insert(respostas).values({ ...dados, id: respostaId }),
      db.insert(revisoes).values({ questaoId: dados.questaoId, ...estado }).onConflictDoUpdate({ target: revisoes.questaoId, set: estado }),
      ...(passos.length ? [db.insert(respostasPassos).values(passos)] : []),
    ]);
    return true;
  } catch (e) {
    if (violouUnico(e)) return false;
    throw e;
  }
}

function violouUnico(e: unknown) {
  // o erro do Postgres (code 23505) pode vir embrulhado pelo Drizzle em .cause
  for (let x: unknown = e; x instanceof Error; x = x.cause) if ((x as { code?: unknown }).code === "23505") return true;
  return false;
}

// A resposta já gravada desta questão nesta sessão (para devolver a mesma conferência ao reenviar).
export async function respostaGravada(sessaoId: string, questaoId: string) {
  const [r] = await db
    .select({
      acertou: respostas.acertou,
      tempoMs: respostas.tempoMs,
      notas: sql<Record<string, Nota> | null>`(select json_object_agg(rp.passo_id, rp.nota) from respostas_passos rp where rp.resposta_id = "respostas"."id")`,
    })
    .from(respostas)
    .where(and(eq(respostas.sessaoId, sessaoId), eq(respostas.questaoId, questaoId)));
  return r ?? null;
}
