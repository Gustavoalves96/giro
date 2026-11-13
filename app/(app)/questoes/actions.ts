"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { definirMarcacao } from "@/lib/db/questoes";
import { getGabarito, getProcedimento, registrarConferencia, registrarResposta } from "@/lib/db/quiz";
import type { Checklist } from "@/lib/db/schema";
import { sessaoAberta } from "@/lib/db/sessoes";
import { IdSchema } from "@/lib/disciplinas/schema";
import { avaliarProcedimento, NOTAS, notasCobremPassos } from "@/lib/domain/procedimento";

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

// O gabarito só sai do servidor aqui, depois da resposta. FSRS entra na sessão 12.
export async function responder(entrada: z.input<typeof ResponderSchema>): Promise<Conferencia> {
  await requireUser();
  const r = ResponderSchema.parse(entrada);
  const [q, aberta] = await Promise.all([getGabarito(r.questaoId), r.sessaoId ? sessaoAberta(r.sessaoId) : true]);
  if (!q) throw new Error("Questão não encontrada.");
  if (q.tipo === "procedimento") throw new Error("Use a conferência de passos.");
  // sessão finalizada não recebe mais respostas: o resumo gravado tem que bater com elas
  if (!aberta) throw new Error("Sessão já finalizada.");
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

// ── Procedimento: ela vê só o nome; o checklist sai daqui quando pede para conferir ──

async function procedimentoAtivo(questaoId: string) {
  const q = await getProcedimento(questaoId);
  if (!q || q.tipo !== "procedimento" || !q.checklist) throw new Error("Procedimento não encontrado.");
  if (!q.ativa) throw new Error("Procedimento inativo.");
  return { ...q, checklist: q.checklist };
}

export async function abrirChecklist(questaoId: string): Promise<Checklist> {
  await requireUser();
  return (await procedimentoAtivo(IdSchema.parse(questaoId))).checklist;
}

const ConferirSchema = z.object({
  questaoId: IdSchema,
  sessaoId: IdSchema.nullable(),
  notas: z.record(z.string().min(1).max(100), z.enum(NOTAS)),
  tempoMs: ResponderSchema.shape.tempoMs,
});

export type ConferenciaProcedimento =
  | {
      ok: true;
      fracao: number;
      criticosEsquecidos: string[];
      acertou: boolean;
      pontosDeAtencao: string;
      fonte: string | null;
      tempoMs: number;
    }
  // os passos mudaram desde que abriu (editado no meio): a tela recarrega com o checklist atual
  | { ok: false; mensagem: string; checklist: Checklist };

export async function conferirProcedimento(entrada: z.input<typeof ConferirSchema>): Promise<ConferenciaProcedimento> {
  await requireUser();
  const r = ConferirSchema.parse(entrada);
  const [q, aberta] = await Promise.all([procedimentoAtivo(r.questaoId), r.sessaoId ? sessaoAberta(r.sessaoId) : true]);
  if (!aberta) throw new Error("Sessão já finalizada.");
  const { passos } = q.checklist;
  if (!notasCobremPassos(passos, r.notas))
    return {
      ok: false,
      mensagem: "O checklist deste procedimento mudou enquanto você conferia. Recarregamos os passos: confira de novo.",
      checklist: q.checklist,
    };

  const av = avaliarProcedimento(passos, r.notas);
  await registrarConferencia(
    { questaoId: r.questaoId, sessaoId: r.sessaoId, respostaDada: "checklist", acertou: av.acertou, tempoMs: r.tempoMs },
    r.notas,
  );
  return { ok: true, ...av, pontosDeAtencao: q.explicacao, fonte: q.fonte, tempoMs: r.tempoMs };
}

export async function sinalizarErro(questaoId: string, valor: boolean) {
  await requireUser();
  await definirMarcacao(IdSchema.parse(questaoId), "sinalizadaComErro", z.boolean().parse(valor));
}
