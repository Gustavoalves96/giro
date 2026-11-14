"use server";

import { requireUser } from "@/lib/auth/require-user";
import { revisaoAberta } from "@/lib/db/revisao";
import { criarSessao } from "@/lib/db/sessoes";

// "Revisar agora": continua a revisão aberta (saiu no meio) ou cria uma sessão modo='revisao'.
export async function comecarRevisao() {
  await requireUser();
  const id = (await revisaoAberta()) ?? (await criarSessao("revisao"));
  return `/revisao/sessao/${id}/questoes`;
}
