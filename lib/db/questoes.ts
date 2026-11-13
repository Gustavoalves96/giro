import { asc, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { type NovaQuestao, questoes } from "./schema";

export type DadosQuestao = Omit<NovaQuestao, "id" | "topicoId" | "criadoEm" | "ativa" | "sinalizadaComErro">;

// Questões do tópico com nº de respostas e acertos (taxa de acerto na tela).
export async function listarQuestoes(topicoId: string) {
  return db
    .select({
      id: questoes.id,
      tipo: questoes.tipo,
      enunciado: questoes.enunciado,
      alternativas: questoes.alternativas,
      gabarito: questoes.gabarito,
      explicacao: questoes.explicacao,
      fonte: questoes.fonte,
      dificuldade: questoes.dificuldade,
      origem: questoes.origem,
      ativa: questoes.ativa,
      sinalizadaComErro: questoes.sinalizadaComErro,
      respostas: sql<number>`(select count(*) from respostas r where r.questao_id = "questoes"."id")`.mapWith(Number),
      acertos:
        sql<number>`(select count(*) from respostas r where r.questao_id = "questoes"."id" and r.acertou)`.mapWith(Number),
    })
    .from(questoes)
    .where(eq(questoes.topicoId, topicoId))
    .orderBy(asc(questoes.criadoEm), asc(questoes.id));
}

export async function criarQuestao(topicoId: string, dados: DadosQuestao) {
  await db.insert(questoes).values({ ...dados, topicoId });
}

export async function editarQuestao(id: string, dados: Partial<DadosQuestao>) {
  await db.update(questoes).set(dados).where(eq(questoes.id, id));
}

export async function definirMarcacao(id: string, campo: "ativa" | "sinalizadaComErro", valor: boolean) {
  await db
    .update(questoes)
    .set({ [campo]: valor })
    .where(eq(questoes.id, id));
}
