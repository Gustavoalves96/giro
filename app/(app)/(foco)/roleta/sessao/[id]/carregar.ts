import { notFound } from "next/navigation";
import type { Sessao } from "@/lib/db/schema";
import { getSessao } from "@/lib/db/sessoes";
import { IdSchema } from "@/lib/disciplinas/schema";
import { dono } from "@/lib/auth/require-user";

// Sessão pelo id da URL; id inválido, inexistente ou de outro modo → 404. Também usada pela revisão e pelos erros.
export async function carregarSessao(id: string, modo: Sessao["modo"]) {
  const conta = await dono();
  const ok = IdSchema.safeParse(id);
  const s = ok.success ? await getSessao(conta, ok.data) : null;
  if (!s || s.modo !== modo) notFound();
  return s;
}

export const rota = (id: string, etapa: "estudo" | "questoes" | "resultado") => `/roleta/sessao/${id}/${etapa}`;
