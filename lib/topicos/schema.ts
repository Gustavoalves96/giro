import { z } from "zod";

// Fora de lib/db: lib/db/index.ts exige DATABASE_URL e quebraria o Vitest.
export const TopicoSchema = z.object({
  nome: z
    .string({ error: "Digite o nome do tópico." })
    .trim()
    .min(1, "Digite o nome do tópico.")
    .max(80, "Use no máximo 80 caracteres."),
  // cada linha vira um item de "Foque em" no estudo; vazio = null
  descricao: z
    .string()
    .optional()
    .transform((d) => {
      const linhas = (d ?? "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      return linhas.length ? linhas.join("\n") : null;
    })
    .pipe(z.string().max(1000, "Use no máximo 1000 caracteres.").nullable()),
});
