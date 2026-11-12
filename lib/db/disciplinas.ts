import { asc, avg, count, eq, max } from "drizzle-orm";
import { db } from "./index";
import { disciplinas, topicos } from "./schema";

type Dados = { nome: string; cor: string; notebooklmUrl: string | null };

// Todas as disciplinas (ativas e arquivadas) com nº de tópicos e domínio médio (null = sem tópicos).
export async function listarDisciplinas() {
  const linhas = await db
    .select({
      id: disciplinas.id,
      nome: disciplinas.nome,
      cor: disciplinas.cor,
      notebooklmUrl: disciplinas.notebooklmUrl,
      arquivada: disciplinas.arquivada,
      totalTopicos: count(topicos.id),
      dominioMedio: avg(topicos.dominio),
    })
    .from(disciplinas)
    .leftJoin(topicos, eq(topicos.disciplinaId, disciplinas.id))
    .groupBy(disciplinas.id)
    .orderBy(asc(disciplinas.ordem), asc(disciplinas.criadoEm));
  // avg() volta como string (numeric do Postgres)
  return linhas.map((l) => ({ ...l, dominioMedio: l.dominioMedio === null ? null : Number(l.dominioMedio) }));
}

export async function criarDisciplina(dados: Dados) {
  const [{ maior }] = await db.select({ maior: max(disciplinas.ordem) }).from(disciplinas);
  await db.insert(disciplinas).values({ ...dados, ordem: (maior ?? -1) + 1 });
}

export async function editarDisciplina(id: string, dados: Dados) {
  await db.update(disciplinas).set(dados).where(eq(disciplinas.id, id));
}

export async function definirArquivada(id: string, arquivada: boolean) {
  await db.update(disciplinas).set({ arquivada }).where(eq(disciplinas.id, id));
}

// Troca de lugar com a vizinha entre as ativas e renumera 0..n (corrige ordens repetidas).
export async function moverDisciplina(id: string, direcao: "subir" | "descer") {
  const ativas = await db
    .select({ id: disciplinas.id, ordem: disciplinas.ordem })
    .from(disciplinas)
    .where(eq(disciplinas.arquivada, false))
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
