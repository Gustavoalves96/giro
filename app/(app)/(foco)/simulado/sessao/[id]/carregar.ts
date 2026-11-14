import { notFound } from "next/navigation";
import { getSimulado } from "@/lib/db/simulado";
import { IdSchema } from "@/lib/disciplinas/schema";

// Simulado pelo id da URL; id inválido, inexistente ou de outro modo → 404.
export async function carregarSimulado(id: string) {
  const ok = IdSchema.safeParse(id);
  const s = ok.success ? await getSimulado(ok.data) : null;
  if (!s) notFound();
  return s;
}
