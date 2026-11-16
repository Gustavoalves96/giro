"use server";

import { z } from "zod";
import { dono } from "@/lib/auth/require-user";
import { getRevisao, gravarResposta } from "@/lib/db/quiz";
import { fecharERecalcular, respostasDaSessao } from "@/lib/db/sessoes";
import { criarSessaoSimulado, descartarSimulado, getSimulado, idsElegiveis, questoesDoSimulado } from "@/lib/db/simulado";
import { IdSchema } from "@/lib/disciplinas/schema";
import { proximoEstado, Rating } from "@/lib/domain/fsrs";
import { corrigirSimulado, MAX_QUESTOES, PONTOS_POR_ACERTO, sortearIds } from "@/lib/domain/simulado";

const ComecarSchema = z.object({
  disciplinaIds: z.array(IdSchema).min(1, "Escolha pelo menos uma disciplina.").max(200),
  questoes: z.number().int().min(1).max(MAX_QUESTOES),
  minutos: z.number().int().min(1).max(300),
});

export type Comeco = { ok: true; url: string } | { ok: false; mensagem: string };

// Sorteio no servidor: N questões ativas aleatórias das disciplinas escolhidas, guardadas na sessão na ordem da prova.
export async function comecarSimulado(entrada: z.input<typeof ComecarSchema>): Promise<Comeco> {
  const conta = await dono();
  const r = ComecarSchema.safeParse(entrada);
  if (!r.success) return { ok: false, mensagem: r.error.issues[0].message };
  const ids = sortearIds(await idsElegiveis(conta, r.data.disciplinaIds), r.data.questoes);
  if (!ids.length) return { ok: false, mensagem: "Essas disciplinas ainda não têm questões ativas." };
  const id = await criarSessaoSimulado(conta, ids, r.data.minutos * 60);
  return { ok: true, url: `/simulado/sessao/${id}/questoes` };
}

const EntregarSchema = z.object({
  sessaoId: IdSchema,
  // questaoId → letra ORIGINAL (o cliente desfaz o embaralhamento) ou V/F; ausente = em branco
  respostas: z.record(IdSchema, z.enum(["A", "B", "C", "D", "E", "V", "F"])),
});

/**
 * Entrega: grava só as respostas finais (em branco fica fora do banco), cada uma com FSRS Again/Good (o tempo
 * por questão não é confiável com navegação livre), fecha a sessão com 10 pts por acerto e recalcula o domínio.
 * Reenviar não grava de novo (índice único) nem refecha a sessão.
 */
export async function entregarSimulado(entrada: z.input<typeof EntregarSchema>) {
  const conta = await dono();
  const r = EntregarSchema.parse(entrada);
  const s = await getSimulado(conta, r.sessaoId);
  if (!s) throw new Error("Simulado não encontrado.");
  if (s.finalizadaEm) return;
  const itens = await questoesDoSimulado(conta, s.questaoIds ?? []);
  const lote = corrigirSimulado(itens, r.respostas);
  const agora = new Date();
  await Promise.all(
    lote.porQuestao
      .filter((p) => p.resposta !== null)
      .map(async (p) => {
        const acertou = p.situacao === "acertou";
        const estado = proximoEstado(await getRevisao(p.id), acertou ? Rating.Good : Rating.Again, agora);
        // tempo_ms 0: o simulado não mede tempo por questão
        await gravarResposta({ questaoId: p.id, sessaoId: s.id, respostaDada: p.resposta!, acertou, tempoMs: 0 }, null, estado);
      }),
  );
  // o resumo vem das respostas gravadas (não do cliente); o total conta as em branco
  const gravadas = await respostasDaSessao(conta, s.id);
  const acertos = gravadas.filter((g) => g.acertou).length;
  await fecharERecalcular(conta, s.id, gravadas, {
    totalQuestoes: itens.length,
    acertos,
    pontuacao: acertos * PONTOS_POR_ACERTO,
    maiorSequencia: 0,
  });
}

export async function sairDoSimulado(sessaoId: string) {
  const conta = await dono();
  await descartarSimulado(conta, IdSchema.parse(sessaoId));
}
