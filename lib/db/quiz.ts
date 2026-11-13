import { eq } from "drizzle-orm";
import { db } from "./index";
import { disciplinas, type NovaResposta, questoes, respostas, topicos } from "./schema";

// Consultas da tela de questão (components/quiz). O gabarito só sai daqui depois da resposta.

// Só o que a tela mostra antes da resposta: sem gabarito, explicação nem fonte.
export async function listarQuestoesExibicao() {
  return db
    .select({
      id: questoes.id,
      tipo: questoes.tipo,
      enunciado: questoes.enunciado,
      alternativas: questoes.alternativas,
      sinalizadaComErro: questoes.sinalizadaComErro,
      disciplina: disciplinas.nome,
      cor: disciplinas.cor,
    })
    .from(questoes)
    .innerJoin(topicos, eq(topicos.id, questoes.topicoId))
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .where(eq(questoes.ativa, true));
}

// Para conferir a resposta no servidor.
export async function getGabarito(id: string) {
  const [q] = await db
    .select({
      alternativas: questoes.alternativas,
      gabarito: questoes.gabarito,
      explicacao: questoes.explicacao,
      fonte: questoes.fonte,
    })
    .from(questoes)
    .where(eq(questoes.id, id));
  return q ?? null;
}

export async function registrarResposta(dados: NovaResposta) {
  await db.insert(respostas).values(dados);
}
