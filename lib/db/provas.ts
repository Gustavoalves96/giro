import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "./index";
import { disciplinas, provas, topicos } from "./schema";

type Dados = { disciplinaId: string; titulo: string; data: string; topicoIds: string[] };

// Todas as provas com a disciplina, da data mais próxima para a mais distante.
export async function listarProvas() {
  return db
    .select({
      id: provas.id,
      titulo: provas.titulo,
      data: provas.data,
      topicoIds: provas.topicoIds,
      disciplinaId: disciplinas.id,
      disciplina: disciplinas.nome,
      cor: disciplinas.cor,
    })
    .from(provas)
    .innerJoin(disciplinas, eq(disciplinas.id, provas.disciplinaId))
    .orderBy(asc(provas.data), asc(provas.titulo));
}

// Todos os tópicos (editor e chips da lista). provas.topico_ids não tem FK: quem não estiver aqui foi apagado.
export async function listarTodosTopicos() {
  return db
    .select({ id: topicos.id, nome: topicos.nome, dominio: topicos.dominio, disciplinaId: topicos.disciplinaId })
    .from(topicos)
    .orderBy(asc(topicos.criadoEm), asc(topicos.nome));
}

// Provas de hoje em diante (só o que o peso da roleta precisa). `hoje` = AAAA-MM-DD em SP.
export async function provasDesde(hoje: string) {
  return db.select({ data: provas.data, topicoIds: provas.topicoIds }).from(provas).where(gte(provas.data, hoje));
}

// Card "Próxima prova" do Início (sessão 14): a mais próxima de hoje em diante, com os tópicos que ainda
// existem e o domínio de cada um. null = sem prova marcada.
export async function proximaProva(hoje: string) {
  const [p] = await db
    .select({
      id: provas.id,
      titulo: provas.titulo,
      data: provas.data,
      topicoIds: provas.topicoIds,
      disciplina: disciplinas.nome,
      cor: disciplinas.cor,
    })
    .from(provas)
    .innerJoin(disciplinas, eq(disciplinas.id, provas.disciplinaId))
    .where(gte(provas.data, hoje))
    .orderBy(asc(provas.data), asc(provas.titulo))
    .limit(1);
  if (!p) return null;
  const { topicoIds, ...prova } = p;
  const tops = topicoIds.length
    ? await db
        .select({
          id: topicos.id,
          nome: topicos.nome,
          dominio: topicos.dominio,
          novo: sql<boolean>`not exists (select 1 from respostas r join questoes q on q.id = r.questao_id where q.topico_id = "topicos"."id")`,
        })
        .from(topicos)
        .where(inArray(topicos.id, topicoIds))
        .orderBy(asc(topicos.dominio), asc(topicos.nome))
    : [];
  return { ...prova, topicos: tops };
}

export async function disciplinaExiste(id: string) {
  const [d] = await db.select({ id: disciplinas.id }).from(disciplinas).where(eq(disciplinas.id, id));
  return !!d;
}

// Quantos dos ids são tópicos desta disciplina (para recusar tópico de outra).
export async function contarTopicosDaDisciplina(disciplinaId: string, ids: string[]) {
  if (!ids.length) return 0;
  const r = await db
    .select({ id: topicos.id })
    .from(topicos)
    .where(and(eq(topicos.disciplinaId, disciplinaId), inArray(topicos.id, ids)));
  return r.length;
}

export async function criarProva(dados: Dados) {
  await db.insert(provas).values(dados);
}

// false = a prova não existe mais.
export async function editarProva(id: string, dados: Dados) {
  const r = await db.update(provas).set(dados).where(eq(provas.id, id)).returning({ id: provas.id });
  return r.length > 0;
}

export async function excluirProva(id: string) {
  await db.delete(provas).where(eq(provas.id, id));
}
