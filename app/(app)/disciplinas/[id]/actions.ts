"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { criarTopico, editarTopico, excluirTopico } from "@/lib/db/topicos";
import { IdSchema } from "@/lib/disciplinas/schema";
import { TopicoSchema } from "@/lib/topicos/schema";

export type EstadoTopico = {
  erros?: Partial<Record<"nome" | "descricao", string[]>>;
  salvo?: boolean;
};

// Cria quando o form não traz id; edita quando traz.
export async function salvarTopico(_anterior: EstadoTopico, form: FormData): Promise<EstadoTopico> {
  await requireUser();
  const disciplinaId = IdSchema.parse(form.get("disciplinaId"));
  const id = form.get("id") ? IdSchema.parse(form.get("id")) : null;
  const dados = TopicoSchema.safeParse({ nome: form.get("nome"), descricao: form.get("descricao") ?? undefined });
  if (!dados.success) return { erros: z.flattenError(dados.error).fieldErrors };
  if (id) await editarTopico(id, dados.data);
  else await criarTopico(disciplinaId, dados.data);
  revalidatePath(`/disciplinas/${disciplinaId}`);
  return { salvo: true };
}

export async function excluir(id: string, disciplinaId: string) {
  await requireUser();
  await excluirTopico(IdSchema.parse(id));
  revalidatePath(`/disciplinas/${IdSchema.parse(disciplinaId)}`);
}
