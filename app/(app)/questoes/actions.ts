"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { definirMarcacao } from "@/lib/db/questoes";
import { getGabarito, getProcedimento, getRevisao, gravarResposta, respostaGravada } from "@/lib/db/quiz";
import type { Checklist } from "@/lib/db/schema";
import { sessaoAberta } from "@/lib/db/sessoes";
import { IdSchema } from "@/lib/disciplinas/schema";
import { notaDaResposta, notaDoProcedimento, proximoEstado } from "@/lib/domain/fsrs";
import { avaliarProcedimento, NOTAS, notasCobremPassos } from "@/lib/domain/procedimento";

// Ações do componente de questão (components/quiz), usadas por roleta, revisão, erros e simulado.
// Toda resposta é de uma sessão (uma por questão em cada sessão) e avança o FSRS do item uma vez só.

const NAO_SEI = "?"; // resposta_dada de "Não sei — mostrar resposta" (conta como erro)
const MAX_TEMPO_MS = 30 * 60_000;
const SESSAO_FECHADA = "Esta rodada já foi finalizada; a resposta não foi gravada.";
const PROCEDIMENTO_INATIVO = "Este procedimento foi desativado e não pode mais ser conferido.";

// Erro de regra: a tela mostra a mensagem (não "confira a conexão").
export type Recusa = { ok: false; mensagem: string };

const ResponderSchema = z.object({
  questaoId: IdSchema,
  sessaoId: IdSchema,
  // letra ORIGINAL (o cliente desfaz o embaralhamento) ou V/F; null = "Não sei"
  respostaDada: z.enum(["A", "B", "C", "D", "E", "V", "F"]).nullable(),
  tempoMs: z
    .number()
    .finite()
    .transform((t) => Math.min(MAX_TEMPO_MS, Math.max(0, Math.round(t)))),
});

export type Conferencia = { ok: true; acertou: boolean; gabarito: string; explicacao: string; fonte: string | null } | Recusa;

// O gabarito só sai do servidor aqui, depois da resposta. Reenviar devolve a conferência já gravada.
export async function responder(entrada: z.input<typeof ResponderSchema>): Promise<Conferencia> {
  await requireUser();
  const r = ResponderSchema.parse(entrada);
  const [q, aberta, estado] = await Promise.all([getGabarito(r.questaoId), sessaoAberta(r.sessaoId), getRevisao(r.questaoId)]);
  if (!q) throw new Error("Questão não encontrada.");
  if (q.tipo === "procedimento") throw new Error("Use a conferência de passos.");
  const conferencia = (acertou: boolean) => ({ ok: true as const, acertou, gabarito: q.gabarito, explicacao: q.explicacao, fonte: q.fonte });
  // sessão finalizada não recebe mais respostas: o resumo gravado tem que bater com elas
  if (!aberta) return { ok: false, mensagem: SESSAO_FECHADA };
  const validas = q.alternativas?.length ? q.alternativas.map((a) => a.letra) : ["V", "F"];
  if (r.respostaDada !== null && !validas.includes(r.respostaDada)) throw new Error("Resposta inválida.");

  const acertou = r.respostaDada === q.gabarito;
  const agora = new Date();
  const gravou = await gravarResposta(
    { questaoId: r.questaoId, sessaoId: r.sessaoId, respostaDada: r.respostaDada ?? NAO_SEI, acertou, tempoMs: r.tempoMs },
    null,
    proximoEstado(estado, notaDaResposta({ acertou, tempoMs: r.tempoMs }), agora),
  );
  if (gravou) return conferencia(acertou);
  const ja = await respostaGravada(r.sessaoId, r.questaoId);
  if (!ja) throw new Error("Resposta não encontrada.");
  return conferencia(ja.acertou);
}

// ── Procedimento: ela vê só o nome; o checklist sai daqui quando pede para conferir ──

async function procedimentoAtivo(questaoId: string) {
  const q = await getProcedimento(questaoId);
  if (!q || q.tipo !== "procedimento" || !q.checklist) throw new Error("Procedimento não encontrado.");
  return { ...q, checklist: q.checklist };
}

export async function abrirChecklist(questaoId: string): Promise<{ ok: true; checklist: Checklist } | Recusa> {
  await requireUser();
  const q = await procedimentoAtivo(IdSchema.parse(questaoId));
  return q.ativa ? { ok: true, checklist: q.checklist } : { ok: false, mensagem: PROCEDIMENTO_INATIVO };
}

const ConferirSchema = z.object({
  questaoId: IdSchema,
  sessaoId: IdSchema,
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
  // checklist presente: os passos mudaram desde que abriu (editado no meio) e a tela recarrega com os atuais
  | (Recusa & { checklist?: Checklist });

export async function conferirProcedimento(entrada: z.input<typeof ConferirSchema>): Promise<ConferenciaProcedimento> {
  await requireUser();
  const r = ConferirSchema.parse(entrada);
  const [q, aberta, estado] = await Promise.all([procedimentoAtivo(r.questaoId), sessaoAberta(r.sessaoId), getRevisao(r.questaoId)]);
  const { passos } = q.checklist;
  const conferencia = (notas: Record<string, (typeof NOTAS)[number]>, tempoMs: number) => ({
    ok: true as const,
    ...avaliarProcedimento(passos, notas),
    pontosDeAtencao: q.explicacao,
    fonte: q.fonte,
    tempoMs,
  });

  if (!aberta) return { ok: false, mensagem: SESSAO_FECHADA };
  if (!q.ativa) return { ok: false, mensagem: PROCEDIMENTO_INATIVO };
  if (!notasCobremPassos(passos, r.notas))
    return {
      ok: false,
      mensagem: "O checklist deste procedimento mudou enquanto você conferia. Recarregamos os passos: confira de novo.",
      checklist: q.checklist,
    };

  const av = avaliarProcedimento(passos, r.notas);
  const agora = new Date();
  const gravou = await gravarResposta(
    { questaoId: r.questaoId, sessaoId: r.sessaoId, respostaDada: "checklist", acertou: av.acertou, tempoMs: r.tempoMs },
    r.notas,
    proximoEstado(estado, notaDoProcedimento({ fracao: av.fracao, criticosEsquecidos: av.criticosEsquecidos.length }), agora),
  );
  if (gravou) return conferencia(r.notas, r.tempoMs);
  // já conferido nesta sessão (resposta perdida no wifi, reenvio): devolve a conferência gravada
  const ja = await respostaGravada(r.sessaoId, r.questaoId);
  if (!ja) throw new Error("Conferência não encontrada.");
  return conferencia(ja.notas ?? {}, ja.tempoMs);
}

export async function sinalizarErro(questaoId: string, valor: boolean) {
  await requireUser();
  await definirMarcacao(IdSchema.parse(questaoId), "sinalizadaComErro", z.boolean().parse(valor));
}
