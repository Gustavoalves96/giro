"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dono } from "@/lib/auth/require-user";
import { criarDisciplina, definirArquivada, editarDisciplina, excluirDisciplina, moverDisciplina } from "@/lib/db/disciplinas";
import { DISCIPLINA_COM_HISTORICO, DisciplinaSchema, IdSchema } from "@/lib/disciplinas/schema";

export type EstadoDisciplina = {
  erros?: Partial<Record<"nome" | "cor" | "notebooklmUrl", string[]>>;
  salvo?: boolean;
};

// Cria quando o form não traz id; edita quando traz.
export async function salvarDisciplina(_anterior: EstadoDisciplina, form: FormData): Promise<EstadoDisciplina> {
  const conta = await dono();
  const id = form.get("id") ? IdSchema.parse(form.get("id")) : null;
  const dados = DisciplinaSchema.safeParse({
    nome: form.get("nome"),
    cor: form.get("cor"),
    notebooklmUrl: form.get("notebooklmUrl") ?? undefined,
  });
  if (!dados.success) return { erros: z.flattenError(dados.error).fieldErrors };
  if (id) await editarDisciplina(conta, id, dados.data);
  else await criarDisciplina(conta, dados.data);
  revalidatePath("/disciplinas");
  return { salvo: true };
}

export async function mover(id: string, direcao: "subir" | "descer") {
  const conta = await dono();
  await moverDisciplina(conta, IdSchema.parse(id), z.enum(["subir", "descer"]).parse(direcao));
  revalidatePath("/disciplinas");
}

export async function excluir(id: string): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  const conta = await dono();
  const excluida = await excluirDisciplina(conta, IdSchema.parse(id));
  revalidatePath("/disciplinas");
  return excluida ? { ok: true } : { ok: false, mensagem: DISCIPLINA_COM_HISTORICO };
}

export async function arquivar(id: string, arquivada: boolean) {
  const conta = await dono();
  await definirArquivada(conta, IdSchema.parse(id), z.boolean().parse(arquivada));
  revalidatePath("/disciplinas");
}
