import { notFound } from "next/navigation";
import { getSessao } from "@/lib/db/sessoes";
import { IdSchema } from "@/lib/disciplinas/schema";

// Sessão da roleta pelo id da URL; id inválido, inexistente ou de outro modo → 404.
export async function carregarSessao(id: string) {
  const ok = IdSchema.safeParse(id);
  const s = ok.success ? await getSessao(ok.data) : null;
  if (!s || s.modo !== "roleta") notFound();
  return s;
}

export const rota = (id: string, etapa: "estudo" | "questoes" | "resultado") => `/roleta/sessao/${id}/${etapa}`;
