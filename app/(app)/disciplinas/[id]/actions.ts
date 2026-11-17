"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dono } from "@/lib/auth/require-user";
import { criarTopico, definirTopicoArquivado, editarTopico, excluirTopico } from "@/lib/db/topicos";
import { IdSchema } from "@/lib/disciplinas/schema";
import { TOPICO_COM_HISTORICO, TopicoSchema } from "@/lib/topicos/schema";

export type EstadoTopico = {
  erros?: Partial<Record<"nome" | "descricao" | "notebooklmUrl", string[]>>;
  salvo?: boolean;
};

// Cria quando o form não traz id; edita quando traz.
export async function salvarTopico(_anterior: EstadoTopico, form: FormData): Promise<EstadoTopico> {
  const conta = await dono();
  const disciplinaId = IdSchema.parse(form.get("disciplinaId"));
  const id = form.get("id") ? IdSchema.parse(form.get("id")) : null;
  const dados = TopicoSchema.safeParse({
    nome: form.get("nome"),
    descricao: form.get("descricao") ?? undefined,
    // "seguir" = sem link próprio (null): abre o caderno da disciplina
    notebooklmUrl: form.get("caderno") === "proprio" ? (form.get("notebooklmUrl") ?? undefined) : undefined,
  });
  if (!dados.success) return { erros: z.flattenError(dados.error).fieldErrors };
  if (form.get("caderno") === "proprio" && !dados.data.notebooklmUrl)
    return { erros: { notebooklmUrl: ["Cole o link do caderno deste tópico."] } };
  if (id) await editarTopico(conta, id, dados.data);
  else if (!(await criarTopico(conta, disciplinaId, dados.data))) throw new Error("Disciplina não encontrada.");
  revalidatePath(`/disciplinas/${disciplinaId}`);
  return { salvo: true };
}

export async function excluir(id: string, disciplinaId: string): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  const conta = await dono();
  const excluido = await excluirTopico(conta, IdSchema.parse(id));
  revalidatePath(`/disciplinas/${IdSchema.parse(disciplinaId)}`);
  return excluido ? { ok: true } : { ok: false, mensagem: TOPICO_COM_HISTORICO };
}

export async function arquivar(id: string, disciplinaId: string, arquivado: boolean) {
  const conta = await dono();
  await definirTopicoArquivado(conta, IdSchema.parse(id), z.boolean().parse(arquivado));
  revalidatePath(`/disciplinas/${IdSchema.parse(disciplinaId)}`);
}
