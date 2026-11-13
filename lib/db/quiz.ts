import { and, eq, ne } from "drizzle-orm";
import { db } from "./index";
import type { Nota } from "@/lib/domain/procedimento";
import { disciplinas, type NovaResposta, questoes, respostas, respostasPassos, topicos } from "./schema";

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
    .where(and(eq(questoes.ativa, true), ne(questoes.tipo, "procedimento"))); // /dev/questao: só questões
}

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

// Resposta + uma nota por passo, juntas (batch do neon-http roda numa transação).
export async function registrarConferencia(dados: Omit<NovaResposta, "id">, notas: Record<string, Nota>) {
  const respostaId = crypto.randomUUID();
  await db.batch([
    db.insert(respostas).values({ ...dados, id: respostaId }),
    db.insert(respostasPassos).values(Object.entries(notas).map(([passoId, nota]) => ({ respostaId, passoId, nota }))),
  ]);
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

export async function registrarResposta(dados: NovaResposta) {
  await db.insert(respostas).values(dados);
}
