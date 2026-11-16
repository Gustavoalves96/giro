"use server";

import { dono } from "@/lib/auth/require-user";
import { revisaoAberta } from "@/lib/db/revisao";
import { criarSessao } from "@/lib/db/sessoes";

// "Revisar agora": continua a revisão aberta (saiu no meio) ou cria uma sessão modo='revisao'.
export async function comecarRevisao() {
  const conta = await dono();
  const id = (await revisaoAberta(conta)) ?? (await criarSessao(conta, "revisao"));
  return `/revisao/sessao/${id}/questoes`;
}
