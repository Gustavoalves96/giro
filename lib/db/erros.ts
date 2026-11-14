import { and, asc, desc, eq, sql } from "drizzle-orm";
import { cadernoDeErros } from "@/lib/domain/erros";
import type { Nota } from "@/lib/domain/procedimento";
import { db } from "./index";
import { disciplinas, questoes, respostas, topicos } from "./schema";

// Caderno de erros: última resposta de cada questão (DISTINCT ON) quando foi errada; só itens ativos de
// disciplinas não arquivadas (como a revisão e a roleta). Traz o gabarito: a lista mostra resposta × gabarito.
export async function listarErros() {
  const ultima = db
    .selectDistinctOn([respostas.questaoId], {
      id: respostas.id,
      questaoId: respostas.questaoId,
      respostaDada: respostas.respostaDada,
      acertou: respostas.acertou,
      respondidaEm: respostas.respondidaEm,
    })
    .from(respostas)
    .orderBy(asc(respostas.questaoId), desc(respostas.respondidaEm), desc(respostas.id))
    .as("ultima");

  const linhas = await db
    .select({
      id: ultima.id,
      questaoId: ultima.questaoId,
      respostaDada: ultima.respostaDada,
      acertou: ultima.acertou,
      respondidaEm: ultima.respondidaEm,
      tipo: questoes.tipo,
      enunciado: questoes.enunciado,
      alternativas: questoes.alternativas,
      gabarito: questoes.gabarito,
      checklist: questoes.checklist,
      sinalizadaComErro: questoes.sinalizadaComErro,
      topicoId: topicos.id,
      topico: topicos.nome,
      disciplinaId: disciplinas.id,
      disciplina: disciplinas.nome,
      cor: disciplinas.cor,
      notas: sql<{ passoId: string; nota: Nota }[] | null>`(select json_agg(json_build_object('passoId', rp.passo_id, 'nota', rp.nota)) from respostas_passos rp where rp.resposta_id = "ultima"."id")`,
    })
    .from(ultima)
    .innerJoin(questoes, eq(questoes.id, ultima.questaoId))
    .innerJoin(topicos, eq(topicos.id, questoes.topicoId))
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .where(and(eq(ultima.acertou, false), eq(questoes.ativa, true), eq(disciplinas.arquivada, false)));
  return cadernoDeErros(linhas);
}

export type ItemErro = Awaited<ReturnType<typeof listarErros>>[number];
export type FiltroErros = { disciplina?: string; topico?: string; questao?: string };

export const filtrarErros = (itens: ItemErro[], f: FiltroErros) =>
  itens.filter(
    (i) =>
      (!f.disciplina || i.disciplinaId === f.disciplina) &&
      (!f.topico || i.topicoId === f.topico) &&
      (!f.questao || i.questaoId === f.questao),
  );
