"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { listarTopicosRoleta } from "@/lib/db/topicos";
import { IdSchema } from "@/lib/disciplinas/schema";
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
