"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { definirMarcacao } from "@/lib/db/questoes";
import { getGabarito, registrarResposta } from "@/lib/db/quiz";
import { IdSchema } from "@/lib/disciplinas/schema";

// Ações do componente de questão (components/quiz), usadas por roleta, revisão, erros e simulado.

const NAO_SEI = "?"; // resposta_dada de "Não sei — mostrar resposta" (conta como erro)
const MAX_TEMPO_MS = 30 * 60_000;

const ResponderSchema = z.object({
  questaoId: IdSchema,
  sessaoId: IdSchema.nullable(),
  // letra ORIGINAL (o cliente desfaz o embaralhamento) ou V/F; null = "Não sei"
  respostaDada: z.enum(["A", "B", "C", "D", "E", "V", "F"]).nullable(),
  tempoMs: z
    .number()
    .finite()
    .transform((t) => Math.min(MAX_TEMPO_MS, Math.max(0, Math.round(t)))),
});

export type Conferencia = { acertou: boolean; gabarito: string; explicacao: string; fonte: string | null };

// O gabarito só sai do servidor aqui, depois da resposta. FSRS entra na sessão 10.
export async function responder(entrada: z.input<typeof ResponderSchema>): Promise<Conferencia> {
  await requireUser();
  const r = ResponderSchema.parse(entrada);
  const q = await getGabarito(r.questaoId);
  if (!q) throw new Error("Questão não encontrada.");
  const validas = q.alternativas?.length ? q.alternativas.map((a) => a.letra) : ["V", "F"];
  if (r.respostaDada !== null && !validas.includes(r.respostaDada)) throw new Error("Resposta inválida.");

  const acertou = r.respostaDada === q.gabarito;
  await registrarResposta({
    questaoId: r.questaoId,
    sessaoId: r.sessaoId,
    respostaDada: r.respostaDada ?? NAO_SEI,
    acertou,
    tempoMs: r.tempoMs,
  });
  return { acertou, gabarito: q.gabarito, explicacao: q.explicacao, fonte: q.fonte };
}

export async function sinalizarErro(questaoId: string, valor: boolean) {
  await requireUser();
  await definirMarcacao(IdSchema.parse(questaoId), "sinalizadaComErro", z.boolean().parse(valor));
}
