import { z } from "zod";
import { IdSchema } from "@/lib/disciplinas/schema";

// Filtro do caderno de erros (search params e "Refazer"). Id inválido ou repetido vira "sem filtro".
const Opcional = IdSchema.optional().catch(undefined);
export const FiltroErrosSchema = z.object({ disciplina: Opcional, topico: Opcional, questao: Opcional });

/** Query string do filtro, sem os campos vazios ("" quando não há filtro). */
export function queryFiltro(f: z.infer<typeof FiltroErrosSchema>) {
  const q = new URLSearchParams(Object.entries(f).filter((e): e is [string, string] => !!e[1])).toString();
  return q ? `?${q}` : "";
}
