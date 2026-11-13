"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import {
  acertosRecentesTopico,
  atualizarDominioTopico,
  criarSessaoRoleta,
  fecharSessao,
  respostasDaSessao,
  salvarEstudoSessao,
} from "@/lib/db/sessoes";
import { listarTopicosRoleta } from "@/lib/db/topicos";
import { IdSchema } from "@/lib/disciplinas/schema";
import { calcularDominio } from "@/lib/domain/dominio";
import { resumoSessao } from "@/lib/domain/pontuacao";
import { EstudoSegundosSchema } from "@/lib/perfil/schema";
import { candidatoDe, MOTIVO_SORTE, montarFatias, motivoPeso, motivoVazio, sortear, type Fatia } from "@/lib/domain/roleta";

const GirarSchema = z.object({
  modo: z.enum(["inteligente", "sorte"]),
  disciplinaIds: z.array(IdSchema).max(200),
  topicoIds: z.array(IdSchema).max(2000).default([]),
});

export type ResultadoGiro = { fatias: Fatia[]; sorteadoId: string | null; motivo: string };

// Sorteio no servidor (CLAUDE.md §4.2); o cliente só anima até a fatia sorteada. Não grava nada.
export async function girar(entrada: z.input<typeof GirarSchema>): Promise<ResultadoGiro> {
  await requireUser();
  const filtro = GirarSchema.parse(entrada);
  const agora = new Date();
  const candidatos = (await listarTopicosRoleta()).map((l) => candidatoDe(l, agora));
  const fatias = montarFatias(candidatos, filtro.modo, filtro);
  if (!fatias.length) return { fatias, sorteadoId: null, motivo: motivoVazio(candidatos.length) };
  const sorteado = sortear(fatias);
  return {
    fatias,
    sorteadoId: sorteado.topicoId,
    motivo: filtro.modo === "sorte" ? MOTIVO_SORTE : motivoPeso(sorteado),
  };
}

// "Começar estudo": cria a sessão e devolve a URL do estudo. O tempo escolhido (só desta rodada) vai na URL.
export async function comecarEstudo(topicoId: string, estudoSegundos: number) {
  await requireUser();
  const segundos = EstudoSegundosSchema.parse(estudoSegundos);
  const id = await criarSessaoRoleta(IdSchema.parse(topicoId));
  return `/roleta/sessao/${id}/estudo?s=${segundos}`;
}

// Tempo efetivo (sem pausas), gravado ao sair do estudo. Teto de 4 h contra valor absurdo do cliente.
export async function registrarEstudo(sessaoId: string, segundos: number) {
  await requireUser();
  const s = z.number().int().min(0).max(4 * 3600).parse(Math.round(segundos));
  await salvarEstudoSessao(IdSchema.parse(sessaoId), s);
}

// Resumo calculado aqui a partir das respostas gravadas da sessão (não do cliente). Só a 1ª chamada grava.
export async function finalizar(sessaoId: string) {
  await requireUser();
  const id = IdSchema.parse(sessaoId);
  const rs = await respostasDaSessao(id);
  const r = resumoSessao(rs);
  const fechada = await fecharSessao(id, {
    totalQuestoes: rs.length,
    acertos: r.acertos,
    pontuacao: r.total,
    maiorSequencia: r.maiorSequencia,
  });
  if (fechada?.topicoId && fechada.finalizadaEm) {
    const acertos = await acertosRecentesTopico(fechada.topicoId, fechada.finalizadaEm, true);
    await atualizarDominioTopico(fechada.topicoId, calcularDominio(acertos), fechada.finalizadaEm);
  }
}
