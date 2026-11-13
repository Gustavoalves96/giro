"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { criarQuestao, definirMarcacao, editarQuestao, inserirQuestoes, listarEnunciados } from "@/lib/db/questoes";
import { IdSchema } from "@/lib/disciplinas/schema";
import { lerResposta } from "@/lib/import/parse-json";
import { LETRAS, OrigemManualSchema, QuestaoImportSchema } from "@/lib/import/schemas";

type Campo = "tipo" | "enunciado" | "alternativas" | "gabarito" | "explicacao" | "fonte" | "dificuldade" | "origem";
export type EstadoQuestao = { erros?: Partial<Record<Campo, string[]>>; salvo?: boolean };

const texto = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : undefined);

// Cria quando o form não traz id; edita quando traz. Mesmo schema da importação (CLAUDE.md §5).
export async function salvarQuestao(_anterior: EstadoQuestao, form: FormData): Promise<EstadoQuestao> {
  await requireUser();
  const topicoId = IdSchema.parse(form.get("topicoId"));
  const id = form.get("id") ? IdSchema.parse(form.get("id")) : null;
  const tipo = texto(form.get("tipo"));

  // alternativas em branco são ignoradas (pode ter só A–C, por exemplo)
  const alternativas = LETRAS.map((letra) => ({ letra, texto: texto(form.get(`alternativa_${letra}`))?.trim() ?? "" }))
    .filter((a) => a.texto);
  const questao = QuestaoImportSchema.safeParse({
    tipo,
    enunciado: texto(form.get("enunciado")),
    alternativas: tipo === "verdadeiro_falso" || alternativas.length === 0 ? undefined : alternativas,
    gabarito: texto(form.get("gabarito")),
    explicacao: texto(form.get("explicacao")),
    fonte: texto(form.get("fonte")),
    dificuldade: texto(form.get("dificuldade")),
  });
  // Na edição de questão importada (notebooklm / ia) o form não manda origem e ela não muda.
  const mudaOrigem = !id || form.has("origem");
  const origem = mudaOrigem ? OrigemManualSchema.safeParse(form.get("origem")) : null;

  if (!questao.success || (origem && !origem.success)) {
    return {
      erros: {
        ...(questao.success ? {} : z.flattenError(questao.error).fieldErrors),
        ...(origem && !origem.success ? { origem: z.flattenError(origem.error).formErrors } : {}),
      },
    };
  }
  const q = questao.data;
  const dados = {
    tipo: q.tipo,
    enunciado: q.enunciado,
    alternativas: q.alternativas ?? null,
    gabarito: q.gabarito,
    explicacao: q.explicacao,
    fonte: q.fonte ?? null,
    dificuldade: q.dificuldade,
  };
  if (id) await editarQuestao(id, origem ? { ...dados, origem: origem.data } : dados);
  else await criarQuestao(topicoId, { ...dados, origem: origem!.data });
  revalidatePath(`/topicos/${topicoId}`);
  return { salvo: true };
}

export type EstadoImportacao = { importadas: number } | { erro: string };

// Recebe o texto colado e lê de novo aqui: a prévia do cliente não é confiável.
export async function importarQuestoes(topicoId: string, texto: string): Promise<EstadoImportacao> {
  await requireUser();
  const id = IdSchema.parse(topicoId);
  const leitura = lerResposta(z.string().max(500_000).parse(texto), await listarEnunciados(id));
  if (!leitura.ok) return { erro: leitura.erro.causa };
  await inserirQuestoes(
    id,
    leitura.validas.map((q) => ({
      tipo: q.tipo,
      enunciado: q.enunciado,
      alternativas: q.alternativas ?? null,
      gabarito: q.gabarito,
      explicacao: q.explicacao,
      fonte: q.fonte ?? null,
      dificuldade: q.dificuldade,
      origem: "notebooklm" as const,
    })),
  );
  revalidatePath(`/topicos/${id}`);
  return { importadas: leitura.validas.length };
}

export async function marcar(id: string, topicoId: string, campo: "ativa" | "sinalizadaComErro", valor: boolean) {
  await requireUser();
  await definirMarcacao(
    IdSchema.parse(id),
    z.enum(["ativa", "sinalizadaComErro"]).parse(campo),
    z.boolean().parse(valor),
  );
  revalidatePath(`/topicos/${IdSchema.parse(topicoId)}`);
}
