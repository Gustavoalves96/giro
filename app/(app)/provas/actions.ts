"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { contarTopicosDaDisciplina, criarProva, disciplinaExiste, editarProva, excluirProva } from "@/lib/db/provas";
import { IdSchema } from "@/lib/disciplinas/schema";
import { DISCIPLINA_INEXISTENTE, PROVA_INEXISTENTE, ProvaSchema, TOPICO_DE_OUTRA_DISCIPLINA } from "@/lib/provas/schema";

export type EstadoProva = {
  erros?: Partial<Record<"disciplinaId" | "titulo" | "data" | "topicoIds", string[]>>;
  mensagem?: string;
  salvo?: boolean;
};

// Cria quando o form não traz id; edita quando traz. Erro de regra volta em `mensagem`.
export async function salvarProva(_anterior: EstadoProva, form: FormData): Promise<EstadoProva> {
  await requireUser();
  const id = form.get("id") ? IdSchema.parse(form.get("id")) : null;
  const dados = ProvaSchema.safeParse({
    disciplinaId: form.get("disciplinaId"),
    titulo: form.get("titulo"),
    data: form.get("data"),
    topicoIds: form.getAll("topicoIds"),
  });
  if (!dados.success) return { erros: z.flattenError(dados.error).fieldErrors };
  const d = dados.data;
  if (!(await disciplinaExiste(d.disciplinaId))) return { mensagem: DISCIPLINA_INEXISTENTE };
  if ((await contarTopicosDaDisciplina(d.disciplinaId, d.topicoIds)) !== d.topicoIds.length)
    return { mensagem: TOPICO_DE_OUTRA_DISCIPLINA };
  if (id) {
    if (!(await editarProva(id, d))) return { mensagem: PROVA_INEXISTENTE };
  } else await criarProva(d);
  revalidatePath("/provas");
  revalidatePath("/roleta");
  return { salvo: true };
}

export async function excluir(id: string) {
  await requireUser();
  await excluirProva(IdSchema.parse(id));
  revalidatePath("/provas");
  revalidatePath("/roleta");
}
