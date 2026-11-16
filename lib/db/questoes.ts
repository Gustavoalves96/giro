import { and, asc, eq, ne, sql } from "drizzle-orm";
import { db } from "./index";
import { questaoDoDono, topicoDoDono } from "./dono";
import { type NovaQuestao, questoes } from "./schema";

export type DadosQuestao = Omit<NovaQuestao, "id" | "topicoId" | "criadoEm" | "ativa" | "sinalizadaComErro">;

// Questões do tópico com nº de respostas e acertos (taxa de acerto na tela).
export async function listarQuestoes(dono: string, topicoId: string) {
  return db
    .select({
      id: questoes.id,
      tipo: questoes.tipo,
      enunciado: questoes.enunciado,
      alternativas: questoes.alternativas,
      gabarito: questoes.gabarito,
      explicacao: questoes.explicacao,
      checklist: questoes.checklist,
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
    .where(and(eq(questoes.topicoId, topicoId), topicoDoDono(dono, questoes.topicoId)))
    .orderBy(asc(questoes.criadoEm), asc(questoes.id));
}

// Quem chama já conferiu que o tópico é da conta (getTopico).
export async function criarQuestao(topicoId: string, dados: DadosQuestao) {
  await db.insert(questoes).values({ ...dados, topicoId });
}

// Para a detecção de duplicatas da importação: questões com questões, procedimentos com procedimentos.
export async function listarEnunciados(dono: string, topicoId: string, procedimentos = false) {
  const linhas = await db
    .select({ enunciado: questoes.enunciado })
    .from(questoes)
    .where(
      and(
        eq(questoes.topicoId, topicoId),
        topicoDoDono(dono, questoes.topicoId),
        procedimentos ? eq(questoes.tipo, "procedimento") : ne(questoes.tipo, "procedimento"),
      ),
    );
  return linhas.map((l) => l.enunciado);
}

// Quem chama já conferiu que o tópico é da conta (getTopico). Um INSERT só com todas as linhas; +1 ms por linha para a lista (ordenada por criado_em) manter a ordem da resposta.
export async function inserirQuestoes(topicoId: string, lista: DadosQuestao[]) {
  const agora = Date.now();
  if (lista.length) {
    await db.insert(questoes).values(lista.map((dados, i) => ({ ...dados, topicoId, criadoEm: new Date(agora + i) })));
  }
}

export async function editarQuestao(dono: string, id: string, dados: Partial<DadosQuestao>) {
  await db.update(questoes).set(dados).where(and(eq(questoes.id, id), questaoDoDono(dono, questoes.id)));
}

export async function definirMarcacao(dono: string, id: string, campo: "ativa" | "sinalizadaComErro", valor: boolean) {
  await db
    .update(questoes)
    .set({ [campo]: valor })
    .where(and(eq(questoes.id, id), questaoDoDono(dono, questoes.id)));
}
