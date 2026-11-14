import { z } from "zod";
import { IdSchema } from "@/lib/disciplinas/schema";

// Fora de lib/db: lib/db/index.ts exige DATABASE_URL e quebraria o Vitest.
export const ProvaSchema = z.object({
  disciplinaId: z.uuid({ error: "Escolha a disciplina." }),
  titulo: z
    .string({ error: "Digite o título da prova." })
    .trim()
    .min(1, "Digite o título da prova.")
    .max(80, "Use no máximo 80 caracteres."),
  data: z.iso.date({ error: "Escolha uma data válida." }),
  topicoIds: z
    .array(IdSchema)
    .max(500)
    .transform((ids) => [...new Set(ids)]),
});

export const TOPICO_DE_OUTRA_DISCIPLINA = "Algum tópico marcado não é desta disciplina. Reabra o editor e marque de novo.";
export const DISCIPLINA_INEXISTENTE = "Essa disciplina não existe mais. Recarregue a página.";
export const PROVA_INEXISTENTE = "Essa prova não existe mais. Recarregue a página.";
