"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { criarDisciplina, definirArquivada, editarDisciplina, moverDisciplina } from "@/lib/db/disciplinas";
import { DisciplinaSchema, IdSchema } from "@/lib/disciplinas/schema";

export type EstadoDisciplina = {
  erros?: Partial<Record<"nome" | "cor" | "notebooklmUrl", string[]>>;
  salvo?: boolean;
};

// Cria quando o form não traz id; edita quando traz.
export async function salvarDisciplina(_anterior: EstadoDisciplina, form: FormData): Promise<EstadoDisciplina> {
  await requireUser();
  const id = form.get("id") ? IdSchema.parse(form.get("id")) : null;
  const dados = DisciplinaSchema.safeParse({
    nome: form.get("nome"),
    cor: form.get("cor"),
    notebooklmUrl: form.get("notebooklmUrl") ?? undefined,
  });
  if (!dados.success) return { erros: z.flattenError(dados.error).fieldErrors };
  if (id) await editarDisciplina(id, dados.data);
  else await criarDisciplina(dados.data);
  revalidatePath("/disciplinas");
  return { salvo: true };
}

export async function mover(id: string, direcao: "subir" | "descer") {
  await requireUser();
  await moverDisciplina(IdSchema.parse(id), z.enum(["subir", "descer"]).parse(direcao));
  revalidatePath("/disciplinas");
}

export async function arquivar(id: string, arquivada: boolean) {
  await requireUser();
  await definirArquivada(IdSchema.parse(id), z.boolean().parse(arquivada));
  revalidatePath("/disciplinas");
}
