"use server";

import type { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { criarSessao } from "@/lib/db/sessoes";
import { FiltroErrosSchema, queryFiltro } from "@/lib/erros/schema";

// "Refazer" (uma ou todas as filtradas): sessão modo='erros' nova; o filtro vai na URL das questões,
// que lista os erros dele ainda não respondidos nesta sessão.
export async function refazerErros(entrada: z.input<typeof FiltroErrosSchema>) {
  await requireUser();
  const filtro = FiltroErrosSchema.parse(entrada);
  const id = await criarSessao("erros");
  return `/erros/sessao/${id}/questoes${queryFiltro(filtro)}`;
}
