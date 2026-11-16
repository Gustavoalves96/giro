import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "./index";
import { disciplinaDoDono } from "./dono";
import { disciplinas, provas, topicos } from "./schema";

type Dados = { disciplinaId: string; titulo: string; data: string; topicoIds: string[] };

// Todas as provas com a disciplina, da data mais próxima para a mais distante.
export async function listarProvas(dono: string) {
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
    .where(eq(disciplinas.dono, dono))
    .orderBy(asc(provas.data), asc(provas.titulo));
}

// Todos os tópicos (editor e chips da lista). provas.topico_ids não tem FK: quem não estiver aqui foi apagado.
export async function listarTodosTopicos(dono: string) {
  return db
    .select({ id: topicos.id, nome: topicos.nome, dominio: topicos.dominio, disciplinaId: topicos.disciplinaId })
    .from(topicos)
    .where(disciplinaDoDono(dono, topicos.disciplinaId))
    .orderBy(asc(topicos.criadoEm), asc(topicos.nome));
}

// Provas de hoje em diante (só o que o peso da roleta precisa). `hoje` = AAAA-MM-DD em SP.
export async function provasDesde(dono: string, hoje: string) {
  return db
    .select({ data: provas.data, topicoIds: provas.topicoIds })
    .from(provas)
    .where(and(gte(provas.data, hoje), disciplinaDoDono(dono, provas.disciplinaId)));
}

// Card "Próxima prova" do Início (sessão 14): a mais próxima de hoje em diante, com os tópicos que ainda
// existem e o domínio de cada um. null = sem prova marcada.
export async function proximaProva(dono: string, hoje: string) {
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
    .where(and(gte(provas.data, hoje), eq(disciplinas.dono, dono)))
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

export async function disciplinaExiste(dono: string, id: string) {
  const [d] = await db
    .select({ id: disciplinas.id })
    .from(disciplinas)
    .where(and(eq(disciplinas.id, id), eq(disciplinas.dono, dono)));
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

// Quem chama já conferiu a disciplina (disciplinaExiste) e os tópicos dela (contarTopicosDaDisciplina).
// false = a prova não existe mais (ou é de outra conta).
export async function editarProva(dono: string, id: string, dados: Dados) {
  const r = await db
    .update(provas)
    .set(dados)
    .where(and(eq(provas.id, id), disciplinaDoDono(dono, provas.disciplinaId)))
    .returning({ id: provas.id });
  return r.length > 0;
}

export async function excluirProva(dono: string, id: string) {
  await db.delete(provas).where(and(eq(provas.id, id), disciplinaDoDono(dono, provas.disciplinaId)));
}
