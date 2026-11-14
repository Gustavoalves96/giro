import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { disciplinas, topicos } from "./schema";

type Dados = { nome: string; descricao: string | null };

export async function getDisciplina(id: string) {
  const [d] = await db.select().from(disciplinas).where(eq(disciplinas.id, id));
  return d ?? null;
}

// Nas subqueries, "topicos"."id" vai escrito à mão: em select de uma tabela só o Drizzle gera ${topicos.id}
// sem qualificar, e lá dentro "id" passaria a ser o da tabela interna. (Idem em questoes.ts.)

// Tópicos da disciplina com nº de questões e de procedimentos ativos, total de itens (questões + procedimentos)
// e se já houve alguma resposta (sem = "novo").
export async function listarTopicos(disciplinaId: string) {
  return db
    .select({
      id: topicos.id,
      nome: topicos.nome,
      descricao: topicos.descricao,
      dominio: topicos.dominio,
      questoesAtivas: sql<number>`(select count(*) from questoes q where q.topico_id = "topicos"."id" and q.ativa and q.tipo <> 'procedimento')`.mapWith(
        Number,
      ),
      procedimentosAtivos: sql<number>`(select count(*) from questoes q where q.topico_id = "topicos"."id" and q.ativa and q.tipo = 'procedimento')`.mapWith(
        Number,
      ),
      totalQuestoes: sql<number>`(select count(*) from questoes q where q.topico_id = "topicos"."id")`.mapWith(Number),
      respondido: sql<boolean>`exists (select 1 from respostas r join questoes q on q.id = r.questao_id where q.topico_id = "topicos"."id")`,
    })
    .from(topicos)
    .where(eq(topicos.disciplinaId, disciplinaId))
    .orderBy(asc(topicos.criadoEm), asc(topicos.nome));
}

// Tópico com a disciplina (caminho e cor).
export async function getTopico(id: string) {
  const [t] = await db
    .select({
      id: topicos.id,
      nome: topicos.nome,
      dominio: topicos.dominio,
      disciplinaId: disciplinas.id,
      disciplinaNome: disciplinas.nome,
      cor: disciplinas.cor,
      notebooklmUrl: disciplinas.notebooklmUrl,
      respondido: sql<boolean>`exists (select 1 from respostas r join questoes q on q.id = r.questao_id where q.topico_id = "topicos"."id")`,
    })
    .from(topicos)
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .where(eq(topicos.id, id));
  return t ?? null;
}

// Fatias da roleta: tópicos com ≥ 1 questão ativa, de disciplina não arquivada, agrupados por disciplina.
export async function listarTopicosRoleta() {
  return db
    .select({
      topicoId: topicos.id,
      nome: topicos.nome,
      dominio: topicos.dominio,
      ultimaVezEstudado: topicos.ultimaVezEstudado,
      disciplinaId: disciplinas.id,
      disciplina: disciplinas.nome,
      cor: disciplinas.cor,
      notebooklmUrl: disciplinas.notebooklmUrl,
      novo: sql<boolean>`not exists (select 1 from respostas r join questoes q on q.id = r.questao_id where q.topico_id = "topicos"."id")`,
    })
    .from(topicos)
    .innerJoin(disciplinas, eq(disciplinas.id, topicos.disciplinaId))
    .where(
      and(
        eq(disciplinas.arquivada, false),
        // questão ou procedimento ativo: tópico só com procedimentos também ganha fatia
        sql`exists (select 1 from questoes q where q.topico_id = "topicos"."id" and q.ativa)`,
      ),
    )
    .orderBy(asc(disciplinas.ordem), asc(disciplinas.criadoEm), asc(topicos.criadoEm), asc(topicos.nome));
}

export async function criarTopico(disciplinaId: string, dados: Dados) {
  await db.insert(topicos).values({ ...dados, disciplinaId });
}

export async function editarTopico(id: string, dados: Dados) {
  await db.update(topicos).set(dados).where(eq(topicos.id, id));
}

// Só tópico sem respostas (o histórico não se apaga); o cascade leva questões e revisões. false = recusado.
export async function excluirTopico(id: string) {
  const r = await db
    .delete(topicos)
    .where(
      and(
        eq(topicos.id, id),
        sql`not exists (select 1 from respostas r join questoes q on q.id = r.questao_id where q.topico_id = ${id})`,
      ),
    )
    .returning({ id: topicos.id });
  return r.length > 0;
}
