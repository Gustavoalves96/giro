import { z } from "zod";

// campo vazio = sem link
export const NotebookUrlSchema = z
  .string()
  .trim()
  .optional()
  .transform((u) => u || null)
  .pipe(z.url({ protocol: /^https?$/, error: "Cole um link válido (https://…)." }).nullable());

// Fora de lib/db: lib/db/index.ts exige DATABASE_URL e quebraria o Vitest.
export const DisciplinaSchema = z.object({
  nome: z
    .string({ error: "Digite o nome da disciplina." })
    .trim()
    .min(1, "Digite o nome da disciplina.")
    .max(60, "Use no máximo 60 caracteres."),
  cor: z
    .string({ error: "Escolha uma cor." })
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor no formato #RRGGBB.")
    .transform((c) => c.toUpperCase()),
  notebooklmUrl: NotebookUrlSchema,
});

export const IdSchema = z.uuid();

// Excluir disciplina só sem respostas: o diálogo e a action usam o mesmo texto.
export const DISCIPLINA_COM_HISTORICO =
  "Ela já tem respostas, e o histórico não é apagado. Para tirá-la da roleta e das revisões, arquive.";
