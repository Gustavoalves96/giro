import { and, asc, avg, count, eq, max, sql } from "drizzle-orm";
import { db } from "./index";
import { disciplinas, topicos } from "./schema";

type Dados = { nome: string; cor: string; notebooklmUrl: string | null };

// Todas as disciplinas (ativas e arquivadas) com nº de tópicos e domínio médio (null = sem tópicos).
export async function listarDisciplinas(dono: string) {
  const linhas = await db
    .select({
      id: disciplinas.id,
      nome: disciplinas.nome,
      cor: disciplinas.cor,
      notebooklmUrl: disciplinas.notebooklmUrl,
      arquivada: disciplinas.arquivada,
      totalTopicos: count(topicos.id),
      dominioMedio: avg(topicos.dominio),
      respondida: sql<boolean>`exists (select 1 from respostas r join questoes q on q.id = r.questao_id join topicos t on t.id = q.topico_id where t.disciplina_id = ${disciplinas.id})`,
    })
    .from(disciplinas)
    .leftJoin(topicos, eq(topicos.disciplinaId, disciplinas.id))
    .where(eq(disciplinas.dono, dono))
    .groupBy(disciplinas.id)
    .orderBy(asc(disciplinas.ordem), asc(disciplinas.criadoEm));
  // avg() volta como string (numeric do Postgres)
  return linhas.map((l) => ({ ...l, dominioMedio: l.dominioMedio === null ? null : Number(l.dominioMedio) }));
}

export async function criarDisciplina(dono: string, dados: Dados) {
  const [{ maior }] = await db.select({ maior: max(disciplinas.ordem) }).from(disciplinas).where(eq(disciplinas.dono, dono));
  await db.insert(disciplinas).values({ ...dados, dono, ordem: (maior ?? -1) + 1 });
}

export async function editarDisciplina(dono: string, id: string, dados: Dados) {
  await db.update(disciplinas).set(dados).where(and(eq(disciplinas.id, id), eq(disciplinas.dono, dono)));
}

export async function definirArquivada(dono: string, id: string, arquivada: boolean) {
  await db.update(disciplinas).set({ arquivada }).where(and(eq(disciplinas.id, id), eq(disciplinas.dono, dono)));
}

// Só disciplina sem respostas (o histórico não se apaga, como no tópico); o cascade leva tópicos, questões,
// revisões e provas. false = recusado.
export async function excluirDisciplina(dono: string, id: string) {
  const r = await db
    .delete(disciplinas)
    .where(
      and(
        eq(disciplinas.id, id),
        eq(disciplinas.dono, dono),
        sql`not exists (select 1 from respostas r join questoes q on q.id = r.questao_id join topicos t on t.id = q.topico_id where t.disciplina_id = ${id})`,
      ),
    )
    .returning({ id: disciplinas.id });
  return r.length > 0;
}

// Troca de lugar com a vizinha entre as ativas e renumera 0..n (corrige ordens repetidas).
export async function moverDisciplina(dono: string, id: string, direcao: "subir" | "descer") {
  const ativas = await db
    .select({ id: disciplinas.id, ordem: disciplinas.ordem })
    .from(disciplinas)
    .where(and(eq(disciplinas.dono, dono), eq(disciplinas.arquivada, false)))
    .orderBy(asc(disciplinas.ordem), asc(disciplinas.criadoEm));
  const i = ativas.findIndex((d) => d.id === id);
  const j = direcao === "subir" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ativas.length) return;
  [ativas[i], ativas[j]] = [ativas[j], ativas[i]];
  const mudancas = ativas
    .map((d, ordem) => ({ ...d, nova: ordem }))
    .filter((d) => d.ordem !== d.nova)
    .map((d) => db.update(disciplinas).set({ ordem: d.nova }).where(eq(disciplinas.id, d.id)));
  // batch do driver HTTP do Neon roda numa transação só
  if (mudancas.length) await db.batch(mudancas as [(typeof mudancas)[number], ...typeof mudancas]);
}
